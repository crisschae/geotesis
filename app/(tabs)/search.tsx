import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


interface ProductoBusqueda {
  id_producto: string;
  nombre: string;
  precio: number;
  imagenes: string[];
  ferreteria?: {
    razon_social: string;
  } | null;
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
  const { query } = useLocalSearchParams(); // recibe /search?query=martillo
  const [busqueda, setBusqueda] = useState<string>(query?.toString() || "");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(busqueda, 350);

  
  //Busquedad Automática
  useEffect(() => {
    if (debouncedSearch.trim().length > 1) {
      buscar(debouncedSearch);
    }
  }, [debouncedSearch]);



  // Buscar automáticamente al entrar
  useEffect(() => {
    if (query) {
      const q = query.toString();
      setBusqueda(q);
      buscar(q);
    }
  }, [query]);

  // 🔎 Función de búsqueda en Supabase
  async function buscar(texto: string) {
    if (!texto || texto.trim() === "") return;

    setLoading(true);

    const { data, error } = await supabase
      .from("producto")
      .select(`
        id_producto,
        nombre,
        precio,
        imagenes,
        ferreteria (
          razon_social
        )
      `)
      .ilike("nombre", `%${texto}%`);

    if (!error && data) {

      // 🔥 Normalizar ferreteria: Supabase entrega array, lo convertimos en objeto
      const normalizado = data.map((p: any) => ({
        ...p,
        ferreteria: Array.isArray(p.ferreteria)
          ? p.ferreteria[0] ?? null
          : p.ferreteria ?? null,
      }));

      setResultados(normalizado as ProductoBusqueda[]);
    }

    setLoading(false);
  }


  return (
    <View style={{ flex: 1, padding: 15, backgroundColor: "#111827" }}>
      
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

      {/* Cargando */}
      {loading && <ActivityIndicator size="large" color="#ff8a29" />}

      {/* Resultados */}
      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id_producto}
        renderItem={({ item }) => (
          <View
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
          </View>
        )}
      />
    </View>
  );
}
