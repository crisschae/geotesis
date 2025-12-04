import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
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

  useEffect(() => {
    if (debouncedSearch.trim().length > 1) {
      buscar(debouncedSearch);
    }

    if (debouncedSearch.trim().length === 0) {
      buscar(""); // ⭐ para que cargue categoría sin búsqueda
    }
  }, [debouncedSearch, categoriaSeleccionada]);

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

    if (texto && texto.trim().length > 0) {
      consulta = consulta.ilike("nombre", `%${texto}%`);
    }

    if (categoriaSeleccionada) {
      consulta = consulta.eq("id_categoria", categoriaSeleccionada);
    }

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
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111827" }}>
      <View style={{ flex: 1, padding: 15 }}>

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
            <Text style={{ color: "#ff8a29", fontSize: 16, marginLeft: 10 }}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chips de categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ 
            marginBottom: 10,
            maxHeight:35}}
          contentContainerStyle={{
            paddingVertical: 1,
            alignItems: "center",
          }}
        >
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id_categoria}
              onPress={() =>
                setCategoriaSeleccionada(
                  categoriaSeleccionada === cat.id_categoria
                    ? null
                    : cat.id_categoria
                )
              }
              style={{
                paddingVertical: 5,
                paddingHorizontal: 12,
                backgroundColor:
                  categoriaSeleccionada === cat.id_categoria
                    ? "#ff8a29"
                    : "#1f2937",
                borderRadius: 20,
                marginRight: 8,
                borderWidth: 1,
                borderColor:
                  categoriaSeleccionada === cat.id_categoria
                    ? "#ff8a29"
                    : "#374151",
                height: 36,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color:
                    categoriaSeleccionada === cat.id_categoria
                      ? "#000"
                      : "#fff",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && <ActivityIndicator size="large" color="#ff8a29" />}

        {/* Resultados */}
        <View style={{ flex: 1, marginTop: 10 }}>
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id_producto}
            contentContainerStyle={{
              paddingBottom: 40,
              paddingTop: 0,
            }}
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