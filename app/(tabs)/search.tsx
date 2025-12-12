import { supabase } from "@/lib/supabaseClient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDistanceUserToFerreteria } from "@/services/googleDistance";
import { useUserLocation } from "@/hooks/useUserLocation";

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

// Hook de debounce existente
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
  const router = useRouter();
  const { query } = useLocalSearchParams();

  // Estados principales
  const [busqueda, setBusqueda] = useState<string>(query?.toString() || "");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(busqueda, 350);
  
  // Filtros
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [ordenPrecio, setOrdenPrecio] = useState<"asc" | "desc" | null>(null);
  const [ferreterias, setFerreterias] = useState<any[]>([]);
  const [ferreteriaSeleccionada, setFerreteriaSeleccionada] = useState<string | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // --- ESTADOS PARA LA CREACIÓN DE COTIZACIÓN ---
  const [solicitudNombre, setSolicitudNombre] = useState("");
  const [solicitudCantidad, setSolicitudCantidad] = useState("1");
  const [itemsSolicitados, setItemsSolicitados] = useState<{ nombre_busqueda: string; cantidad: number }[]>([]);
  const [creando, setCreando] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<string[]>([]); // Lista de sugerencias
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false); // Controlar visibilidad

  const { location } = useUserLocation();
  const ORANGE = "#ff8a29";
  const DARK_BG = "#111827";

  // Debounce específico para el input de autocompletado de la cotización
  const debouncedSolicitudNombre = useDebounce(solicitudNombre, 300);

  // 1. Cargar datos iniciales
  useEffect(() => {
    async function init() {
      const { data: f } = await supabase.from("ferreteria").select("id_ferreteria, razon_social");
      if (f) setFerreterias(f);

      const { data: c } = await supabase.from("categoria").select("*").order("nombre");
      if (c) setCategorias(c);

      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user) {
        const { data: cli } = await supabase
          .from("cliente_app")
          .select("id_cliente")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (cli?.id_cliente) setClienteId(cli.id_cliente);
      }
    }
    init();
  }, []);

  // 2. Lógica del buscador principal (Resultados abajo)
  useEffect(() => {
    if (debouncedSearch.trim().length > 1) buscar(debouncedSearch);
    if (debouncedSearch.trim().length === 0) buscar("");
  }, [debouncedSearch, categoriaSeleccionada, ordenPrecio, ferreteriaSeleccionada]);

  useEffect(() => {
    if (query) {
      const q = query.toString();
      setBusqueda(q);
      buscar(q);
    }
  }, [query]);

  // 3. Lógica del AUTOCOMPLETADO para cotización
  useEffect(() => {
    async function buscarSugerencias() {
      // Si el usuario ya seleccionó algo o borró, ocultamos
      if (debouncedSolicitudNombre.length < 2) {
        setSugerencias([]);
        setMostrandoSugerencias(false);
        return;
      }

      // Evitamos buscar si el texto coincide exactamente con un item ya seleccionado (para no reabrir el menú)
      // Pero aquí simplemente buscamos coincidencias parciales
      const { data, error } = await supabase
        .from("producto")
        .select("nombre")
        .ilike("nombre", `%${debouncedSolicitudNombre}%`)
        .limit(6); // Traemos máximo 6 sugerencias

      if (!error && data) {
        // Filtramos nombres duplicados (porque varias ferreterías venden "Cemento")
        const nombresUnicos = Array.from(new Set(data.map((p) => p.nombre)));
        setSugerencias(nombresUnicos);
        setMostrandoSugerencias(nombresUnicos.length > 0);
      }
    }

    // Solo buscamos si el usuario está escribiendo (y no es el valor vacío)
    buscarSugerencias();
  }, [debouncedSolicitudNombre]);


  async function buscar(texto: string) {
    setLoading(true);
    let consulta = supabase.from("producto").select(`
      id_producto, nombre, precio, imagenes,
      ferreteria (razon_social), categoria (nombre)
    `);

    if (texto && texto.trim().length > 0) consulta = consulta.ilike("nombre", `%${texto}%`);
    if (categoriaSeleccionada) consulta = consulta.eq("id_categoria", categoriaSeleccionada);
    if (ferreteriaSeleccionada) consulta = consulta.eq("id_ferreteria", ferreteriaSeleccionada);
    if (ordenPrecio) consulta = consulta.order("precio", { ascending: ordenPrecio === "asc" });

    const { data, error } = await consulta;
    if (!error && data) {
      const normalizado = data.map((p: any) => ({
        ...p,
        ferreteria: Array.isArray(p.ferreteria) ? p.ferreteria[0] : p.ferreteria,
        categoria: Array.isArray(p.categoria) ? p.categoria[0] : p.categoria,
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
    setMostrandoSugerencias(false); // Ocultar sugerencias
    Keyboard.dismiss();
  };

  const seleccionarSugerencia = (nombre: string) => {
    setSolicitudNombre(nombre);
    setMostrandoSugerencias(false);
    // Opcional: enfocar el input de cantidad automáticamente
  };

  const removeItemSolicitado = (idx: number) => {
    setItemsSolicitados((prev) => prev.filter((_, i) => i !== idx));
  };

  const crearCotizacion = async () => {
    try {
      if (!clienteId) throw new Error("No se encontró tu perfil de cliente");
      if (itemsSolicitados.length === 0) throw new Error("Agrega al menos un producto");
      if (!location) throw new Error("No se pudo obtener tu ubicación");

      setCreando(true);
      const nombresBusqueda = itemsSolicitados.map(item => item.nombre_busqueda);

      // Usamos la función SQL corregida que creamos antes
      const { data: opciones, error: rpcError } = await supabase.rpc(
        "fn_buscar_opciones_cotizacion",
        {
          p_productos_busqueda: nombresBusqueda,
          p_max_resultados: 3,
        }
      );

      if (rpcError) throw rpcError;
      if (!opciones || opciones.length === 0) {
        throw new Error("No se encontraron ferreterías con stock para estos productos.");
      }

      const opcionesCalculadas: any[] = [];

      for (const opcion of opciones) {
        const distanceResult = await getDistanceUserToFerreteria({
          originLat: location.latitude,
          originLng: location.longitude,
          destLat: opcion.latitud,
          destLng: opcion.longitud,
        });

        if (!distanceResult) continue;

        const subtotalProductos = opcion.productos.reduce((acc: number, p: any) => {
          const itemSolicitado = itemsSolicitados.find(
            (item) => item.nombre_busqueda.toLowerCase() === p.nombre.toLowerCase()
          );
          const cantidad = itemSolicitado ? itemSolicitado.cantidad : 1;
          return acc + p.precio * cantidad;
        }, 0);

        const rendimientoKmL = 10;
        const precioCombustible = 1.5; // Ajustar según precio real
        const costoViaje = (distanceResult.distanceKm / rendimientoKmL) * precioCombustible;
        const total = subtotalProductos + costoViaje;

        opcionesCalculadas.push({
          ...opcion,
          subtotal: subtotalProductos,
          costo_viaje: costoViaje,
          total: total,
          distancia: distanceResult.distanceKm,
          duracion: distanceResult.durationMin,
          ferreteria: opcion.ferreteria || opcion.razon_social || "Ferretería",
        });
      }

      if (opcionesCalculadas.length === 0) throw new Error("No se pudieron calcular rutas.");

      // Ordenar por precio
      opcionesCalculadas.sort((a, b) => a.total - b.total);
      const mejorOpcion = opcionesCalculadas[0];

      const { data: cotizacion, error: insertErr } = await supabase
        .from("cotizacion")
        .insert({
          id_cliente: clienteId,
          id_ferreteria: mejorOpcion.id_ferreteria,
          estado: 'vigente', // Usamos un estado válido según tu DB
          total_estimada: mejorOpcion.total,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal_productos: mejorOpcion.subtotal,
          costo_viaje: mejorOpcion.costo_viaje,
          costo_total: mejorOpcion.total,
          distancia_km: mejorOpcion.distancia,
          duracion_min: mejorOpcion.duracion,
          detalle_costos: opcionesCalculadas, // Guardamos las 3 opciones
        })
        .select("id_cotizacion")
        .single();

      if (insertErr) throw insertErr;

      // Insertar detalle (usando snapshot de mejor opción)
            const detallesInsert = mejorOpcion.productos.map((p: any) => {
        // CAMBIO AQUÍ: Usamos toLowerCase() para comparar
        const itemSolicitado = itemsSolicitados.find(
            (item) => item.nombre_busqueda.toLowerCase() === p.nombre.toLowerCase()
        );
        return {
          id_cotizacion: cotizacion.id_cotizacion,
          id_producto: p.id_producto,
          cantidad: itemSolicitado ? itemSolicitado.cantidad : 1,
          precio_unitario_snapshot: p.precio,
          nombre_producto_snapshot: p.nombre,
        };
      });

      await supabase.from("cotizacion_detalle").insert(detallesInsert);

      setItemsSolicitados([]);
      router.push(`/quote-detail/${cotizacion.id_cotizacion}`);

    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Error al crear cotización");
    } finally {
      setCreando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK_BG }}>
      <View style={{ flex: 1, padding: 15 }}>

        {/* --- SECCIÓN DE CREAR COTIZACIÓN --- */}
        <View style={{ backgroundColor: "#1f2937", borderRadius: 12, padding: 12, marginBottom: 14, gap: 10, zIndex: 10 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Crear cotización</Text>
          <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
            Busca productos para cotizar en múltiples ferreterías.
          </Text>
          
          <View style={{ flexDirection: "row", gap: 8, zIndex: 20 }}>
            {/* CONTENEDOR INPUT CON AUTOCOMPLETE */}
            <View style={{ flex: 1, position: 'relative', zIndex: 20 }}>
              <TextInput
                value={solicitudNombre}
                onChangeText={(text) => {
                  setSolicitudNombre(text);
                  // Si limpia el input, ocultar sugerencias
                  if (text.length === 0) setMostrandoSugerencias(false);
                }}
                placeholder="Ej: Cemento, Clavos..."
                placeholderTextColor="#aaa"
                style={{
                  backgroundColor: "#111827",
                  color: "#fff",
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#374151",
                }}
              />

              {/* LISTA FLOTANTE DE SUGERENCIAS */}
              {mostrandoSugerencias && sugerencias.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 45, // Justo debajo del input
                  left: 0,
                  right: 0,
                  backgroundColor: "#1f2937",
                  borderWidth: 1,
                  borderColor: ORANGE,
                  borderRadius: 8,
                  zIndex: 100, // Muy alto para flotar
                  elevation: 10, // Sombra en Android
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  maxHeight: 200, // Máximo alto antes de scroll
                }}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {sugerencias.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => seleccionarSugerencia(item)}
                        style={{
                          padding: 12,
                          borderBottomWidth: index === sugerencias.length - 1 ? 0 : 1,
                          borderBottomColor: "#374151"
                        }}
                      >
                        <Text style={{ color: "#fff" }}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TextInput
              value={solicitudCantidad}
              onChangeText={setSolicitudCantidad}
              placeholder="Cant."
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              style={{
                width: 70,
                backgroundColor: "#111827",
                color: "#fff",
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#374151",
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
              <Text style={{ color: DARK_BG, fontWeight: "700" }}>+</Text>
            </TouchableOpacity>
          </View>

          {itemsSolicitados.length > 0 && (
            <View style={{ gap: 6, marginTop: 6, zIndex: 1 }}>
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
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>x {it.cantidad}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItemSolicitado(idx)}>
                    <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 12 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={crearCotizacion}
            disabled={creando || itemsSolicitados.length === 0}
            style={{
              backgroundColor: creando || itemsSolicitados.length === 0 ? "#4b5563" : ORANGE,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 4,
              zIndex: 1
            }}
          >
            {creando ? (
              <ActivityIndicator color={DARK_BG} />
            ) : (
              <Text style={{ color: DARK_BG, fontWeight: "700" }}>Generar Cotización Inteligente</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- SECCIÓN INFERIOR: BÚSQUEDA TRADICIONAL --- */}
        <View style={{ flexDirection: "row", backgroundColor: "#1f2937", padding: 10, borderRadius: 10, marginBottom: 15, zIndex: 1 }}>
          <TextInput
            value={busqueda}
            onChangeText={(text) => setBusqueda(text)}
            placeholder="Buscar productos sueltos..."
            placeholderTextColor="#aaa"
            style={{ flex: 1, color: "#fff" }}
            onSubmitEditing={() => buscar(busqueda)}
          />
          <TouchableOpacity onPress={() => buscar(busqueda)}>
            <Text style={{ color: ORANGE, fontSize: 16, marginLeft: 10 }}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {/* FILTROS Y RESULTADOS DE LISTA (Igual que antes) */}
        <TouchableOpacity
          onPress={() => setFiltrosAbiertos(!filtrosAbiertos)}
          style={{ backgroundColor: "#1f2937", padding: 10, borderRadius: 10, marginBottom: 10 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {filtrosAbiertos ? "Ocultar filtros ▲" : "Mostrar filtros ▼"}
          </Text>
        </TouchableOpacity>

        {/* ... (Aquí iría la parte de filtros, la he resumido para no extender demasiado el código, pero mantén la que tenías) ... */}
        {/* Si necesitas la parte de los filtros completa de vuelta, avísame, pero es idéntica a la anterior */}
        
        {loading && <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 20 }} />}
        
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id_producto}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={!loading ? <Text style={{ color: "#aaa", textAlign: "center", marginTop: 20 }}>Sin resultados</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/productos/${item.id_producto}`)}
              style={{ backgroundColor: "#1f2937", marginBottom: 12, padding: 12, borderRadius: 10, flexDirection: "row", gap: 12 }}
            >
               <Image source={{ uri: item.imagenes?.[0] }} style={{ width: 60, height: 60, borderRadius: 8 }} />
               <View style={{flex: 1}}>
                 <Text style={{ color: "#fff", fontWeight: "600" }}>{item.nombre}</Text>
                 <Text style={{ color: ORANGE, fontSize: 15 }}>${item.precio}</Text>
                 <Text style={{ color: "#ccc", fontSize: 11 }}>{item.ferreteria?.razon_social}</Text>
               </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}