import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "expo-router"; // ⭐ agregado
import { SafeAreaView } from "react-native-safe-area-context";

interface ProductoBusqueda {
  id_producto: string;
  nombre: string;
  precio: number;
  imagenes: string[];
  ferreteria?: {
    razon_social: string;
  } | null;
}
interface Categoria {
  id_categoria: string;
  nombre: string;
  descripcion?: string | null;
}

function useDebounce(value: string, delay: number = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchScreen() {
  const router = useRouter(); // ⭐ agregado

  const { query } = useLocalSearchParams();
  const [busqueda, setBusqueda] = useState<string>(query?.toString() || "");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(busqueda, 350);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [ordenPrecio, setOrdenPrecio] = useState<"asc" | "desc" | null>(null);
  const [ferreterias, setFerreterias] = useState<any[]>([]);
  const [ferreteriaSeleccionada, setFerreteriaSeleccionada] = useState<string | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  // Estados para cotización por nombre genérico
  const [solicitudNombre, setSolicitudNombre] = useState("");
  const [solicitudCantidad, setSolicitudCantidad] = useState("1");
  const [itemsSolicitados, setItemsSolicitados] = useState<{ nombre_busqueda: string; cantidad: number }[]>([]);
  const [creando, setCreando] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  const ORANGE = "#ff8a29";
  const DARK_BG = "#111827";


  useEffect(() => {
    async function cargarFerreterias() {
      const { data } = await supabase.from("ferreteria").select("id_ferreteria, razon_social");
      if (data) setFerreterias(data);
    }
    cargarFerreterias();
  }, []);

  useEffect(() => {
    async function cargarCategorias() {
      const { data } = await supabase
        .from("categoria")
        .select("*")
        .order("nombre");
      if (data) setCategorias(data);
    }
    cargarCategorias();
  }, []);

  // obtener cliente_app para usar en el RPC
  useEffect(() => {
    const loadCliente = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) return;
      const { data: cliente, error: cErr } = await supabase
        .from("cliente_app")
        .select("id_cliente")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!cErr && cliente?.id_cliente) setClienteId(cliente.id_cliente);
    };
    loadCliente();
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim().length > 1) {
      buscar(debouncedSearch);
    }

    if (debouncedSearch.trim().length === 0) {
      buscar(""); // ⭐ para que cargue categoría sin búsqueda
    }
  }, [debouncedSearch, categoriaSeleccionada, ordenPrecio, ferreteriaSeleccionada]);

  useEffect(() => {
    if (query) {
      const q = query.toString();
      setBusqueda(q);
      buscar(q);
    }
  }, [query]);

  async function buscar(texto: string) {
    setLoading(true);

    let consulta = supabase
      .from("producto")
      .select(`
        id_producto,
        nombre,
        precio,
        imagenes,
        ferreteria (
          razon_social
        ),
        categoria (
          nombre
        )
      `);

    // 🔎 FILTRO POR TEXTO
    if (texto && texto.trim().length > 0) {
      consulta = consulta.ilike("nombre", `%${texto}%`);
    }

    // 🏷️ FILTRO POR CATEGORÍA
    if (categoriaSeleccionada) {
      consulta = consulta.eq("id_categoria", categoriaSeleccionada);
    }

    if (ferreteriaSeleccionada) {
      consulta = consulta.eq("id_ferreteria", ferreteriaSeleccionada);
    }


    // 💰 ORDENAR POR PRECIO (ascendente o descendente)
    if (ordenPrecio) {
      consulta = consulta.order("precio", {
        ascending: ordenPrecio === "asc",
      });
    }

    // 📌 EJECUTAR CONSULTA
    const { data, error } = await consulta;

    if (!error && data) {
      const normalizado = data.map((p: any) => ({
        ...p,
        ferreteria: Array.isArray(p.ferreteria)
          ? p.ferreteria[0] ?? null
          : p.ferreteria ?? null,
        categoria: Array.isArray(p.categoria)
          ? p.categoria[0] ?? null
          : p.categoria ?? null,
      }));

      setResultados(normalizado as ProductoBusqueda[]);
    }

    setLoading(false);
  }

  const addItemSolicitado = () => {
    const nombre = solicitudNombre.trim();
    const qty = Math.max(1, parseInt(solicitudCantidad || "1", 10));
    if (!nombre) return;
    setItemsSolicitados((prev) => [...prev, { nombre_busqueda: nombre, cantidad: qty }]);
    setSolicitudNombre("");
    setSolicitudCantidad("1");
  };

  const removeItemSolicitado = (idx: number) => {
    setItemsSolicitados((prev) => prev.filter((_, i) => i !== idx));
  };

  const crearCotizacion = async () => {
    try {
      if (!clienteId) throw new Error("No se encontró tu perfil de cliente");
      if (itemsSolicitados.length === 0) throw new Error("Agrega al menos un producto");
      setCreando(true);
      const { data, error } = await supabase.rpc("fn_create_cotizacion_desde_busqueda", {
        p_id_cliente: clienteId,
        p_items: itemsSolicitados,
        p_max_resultados: 3,
      });
      if (error) throw error;
      if (data?.status !== "ok") {
        throw new Error(data?.message ?? "No se pudo crear la cotización");
      }
      Alert.alert("Cotización creada", `ID: ${data.id_cotizacion}`, [
        { text: "Ver cotizaciones", onPress: () => router.push("/(tabs)/quotes") },
        { text: "OK" },
      ]);
      setItemsSolicitados([]);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo crear la cotización");
    } finally {
      setCreando(false);
    }
  };

  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK_BG }}>
      <View style={{ flex: 1, padding: 15 }}>

        {/* Crear cotización por nombre */}
        <View style={{ backgroundColor: "#1f2937", borderRadius: 12, padding: 12, marginBottom: 14, gap: 10 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Crear cotización</Text>
          <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
            Escribe el nombre del producto (ej: "cemento") y la cantidad. Buscaremos la mejor ferretería con stock y costo total.
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={solicitudNombre}
              onChangeText={setSolicitudNombre}
              placeholder="Nombre del producto"
              placeholderTextColor="#aaa"
              style={{
                flex: 1,
                backgroundColor: "#111827",
                color: "#fff",
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            />
            <TextInput
              value={solicitudCantidad}
              onChangeText={setSolicitudCantidad}
              placeholder="Cant."
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              style={{
                width: 80,
                backgroundColor: "#111827",
                color: "#fff",
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#1f2937",
                textAlign: "center",
              }}
            />
            <TouchableOpacity
              onPress={addItemSolicitado}
              style={{
                backgroundColor: ORANGE,
                paddingHorizontal: 12,
                justifyContent: "center",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: DARK_BG, fontWeight: "700" }}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {itemsSolicitados.length > 0 && (
            <View style={{ gap: 6, marginTop: 6 }}>
              {itemsSolicitados.map((it, idx) => (
                <View
                  key={`${it.nombre_busqueda}-${idx}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#0f172a",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <View>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>{it.nombre_busqueda}</Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Cantidad: {it.cantidad}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItemSolicitado(idx)}>
                    <Text style={{ color: "#ef4444", fontWeight: "700" }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={crearCotizacion}
            disabled={creando || itemsSolicitados.length === 0}
            style={{
              backgroundColor: creando || itemsSolicitados.length === 0 ? "#6b7280" : ORANGE,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ color: DARK_BG, fontWeight: "700" }}>
              {creando ? "Creando..." : "Generar cotización"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#1f2937",
            padding: 10,
            borderRadius: 10,
            marginBottom: 15,
          }}
        >
          <TextInput
            value={busqueda}
            onChangeText={(text) => setBusqueda(text)}
            placeholder="Buscar productos..."
            placeholderTextColor="#aaa"
            style={{ flex: 1, color: "#fff" }}
            onSubmitEditing={() => buscar(busqueda)}
          />

          <TouchableOpacity onPress={() => buscar(busqueda)}>
            <Text style={{ color: ORANGE, fontSize: 16, marginLeft: 10 }}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setFiltrosAbiertos(!filtrosAbiertos)}
          style={{
            backgroundColor: "#1f2937",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {filtrosAbiertos ? "Ocultar filtros ▲" : "Mostrar filtros ▼"}
          </Text>
        </TouchableOpacity>
        {filtrosAbiertos && (
          <View
            style={{
              backgroundColor: "#1f2937",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              gap: 12,
            }}
          >
            {/* Categorías */}
            <View>
              <Text style={{ color: "#fff", marginBottom: 5, fontWeight: "700" }}>
                Categoría
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id_categoria}
                    onPress={() =>
                      setCategoriaSeleccionada(
                        categoriaSeleccionada === cat.id_categoria ? null : cat.id_categoria
                      )
                    }
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor:
                        categoriaSeleccionada === cat.id_categoria
                          ? "#ff8a29"
                          : "#111827",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor:
                        categoriaSeleccionada === cat.id_categoria ? "#ff8a29" : "#374151",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          categoriaSeleccionada === cat.id_categoria ? "#000" : "#fff",
                      }}
                    >
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Ordenar por precio */}
            <View>
              <Text style={{ color: "#fff", marginBottom: 5, fontWeight: "700" }}>
                Ordenar por
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setOrdenPrecio("asc")}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: ordenPrecio === "asc" ? "#ff8a29" : "#111827",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: ordenPrecio === "asc" ? "#ff8a29" : "#374151",
                  }}
                >
                  <Text style={{ color: ordenPrecio === "asc" ? "#000" : "#fff" }}>
                    Precio más bajo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setOrdenPrecio("desc")}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: ordenPrecio === "desc" ? "#ff8a29" : "#111827",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: ordenPrecio === "desc" ? "#ff8a29" : "#374151",
                  }}
                >
                  <Text style={{ color: ordenPrecio === "desc" ? "#000" : "#fff" }}>
                    Precio más alto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Filtrar por Ferretería */}
            <View>
              <Text style={{ color: "#fff", marginBottom: 5, fontWeight: "700" }}>
                Ferretería
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {ferreterias.map((f) => (
                  <TouchableOpacity
                    key={f.id_ferreteria}
                    onPress={() =>
                      setFerreteriaSeleccionada(
                        ferreteriaSeleccionada === f.id_ferreteria ? null : f.id_ferreteria
                      )
                    }
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor:
                        ferreteriaSeleccionada === f.id_ferreteria ? "#ff8a29" : "#111827",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor:
                        ferreteriaSeleccionada === f.id_ferreteria ? "#ff8a29" : "#374151",
                    }}
                  >
                    <Text
                      style={{
                        color: ferreteriaSeleccionada === f.id_ferreteria ? "#000" : "#fff",
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {f.razon_social}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>


            {/* Botón limpiar filtros */}
            <TouchableOpacity
              onPress={() => {
                setCategoriaSeleccionada(null);
                setOrdenPrecio(null);
                setFerreteriaSeleccionada(null);
                setBusqueda("");
                buscar("");
              }}
              style={{
                backgroundColor: "#ef4444",
                padding: 10,
                borderRadius: 10,
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                Limpiar filtros
              </Text>
            </TouchableOpacity>
          </View>
        )}


        {loading && <ActivityIndicator size="large" color="#ff8a29" />}
        <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>
          {resultados.length} resultados encontrados
        </Text>


        {/* Resultados */}
        <View style={{ flex: 1, marginTop: 10 }}>
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id_producto}
            contentContainerStyle={{
              paddingBottom: 40,
              paddingTop: 0,
            }}

            // ⭐ MENSAJE SI NO HAY RESULTADOS
            ListEmptyComponent={() =>
              !loading ? (
                <Text
                  style={{
                    color: "#9CA3AF",
                    textAlign: "center",
                    marginTop: 40,
                    fontSize: 16,
                  }}
                >
                  No se encontraron productos con los filtros aplicados.
                </Text>
              ) : null
            }
            
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/productos/${item.id_producto}`)}
                style={{
                  backgroundColor: "#1f2937",
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: item.imagenes?.[0] }}
                  style={{ width: 70, height: 70, borderRadius: 8 }}
                  resizeMode="cover"
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                    {item.nombre}
                  </Text>

                  <Text style={{ color: "#ff8a29", fontSize: 16, marginTop: 4 }}>
                    ${item.precio}
                  </Text>

                  <Text style={{ color: "#ccc", fontSize: 12 }}>
                    {item.ferreteria?.razon_social}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}