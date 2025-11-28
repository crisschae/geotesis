// app/ferreteria/[id].tsx
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import MapView, { Marker } from "react-native-maps";

export default function FerreteriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // HEADER PERSONALIZADO ⭐
  useLayoutEffect(() => {
    navigation.setOptions({
      title: store?.name || "Cargando…",
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
    });
  }, [store]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setErr(null);

      // 1️⃣ OBTENER FERRETERÍA
      const { data: sData, error: sErr } = await supabase
        .from("ferreteria")
        .select("*")
        .eq("id_ferreteria", id)
        .single();

      if (sErr || !sData) {
        setErr("No se pudo cargar la ferretería");
        setLoading(false);
        return;
      }
      console.log("Horario recibido:", sData.horario);

      setStore({
        id: sData.id_ferreteria,
        name: sData.razon_social,
        address: sData.direccion,
        phone: sData.telefono,
        lat: sData.latitud,
        lng: sData.longitud,
        horario: sData.horario,
      });

      // 2️⃣ OBTENER PRODUCTOS
      const { data: pData } = await supabase
        .from("producto")
        .select("*")
        .eq("id_ferreteria", sData.id_ferreteria);

      setProducts(pData || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // 🟨 SKELETON LOADING PRO
  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonText} />
        <View style={styles.skeletonTextSmall} />
        <View style={styles.skeletonCard} />
      </ScrollView>
    );
  }

  // ERROR
  if (err || !store) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>❌ {err}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const diasOrden = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

  function renderHorario(horario: any) {
    return diasOrden.map((dia) => {
      const h = horario[dia];

      const label = dia.charAt(0).toUpperCase() + dia.slice(1);

      if (!h || h.abre === null) {
        return (
          <Text key={dia} style={styles.horarioTexto}>
            {label}: Cerrado
          </Text>
        );
      }

      return (
        <Text key={dia} style={styles.horarioTexto}>
          {label}: {h.abre} - {h.cierra}
        </Text>
      );
    });
  }

  const mapsUrl =
    store.lat && store.lng
      ? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`;
    

  return (
    
    <ScrollView style={styles.container}>
      
      {/* 🔨 HEADER FERRETERÍA */}
      <Text style={styles.title}>{store.name}</Text>
      <Text style={styles.subtitle}>📍 {store.address}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(mapsUrl)}>
        <Text style={styles.btnText}>Navegar con Google Maps</Text>
      </TouchableOpacity>

      {/* 📍 MAPA SOLO EN MOBILE */}
      {Platform.OS !== "web" && store.lat && store.lng && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: store.lat,
            longitude: store.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} />
        </MapView>
      )}

      {/* 📝 DESCRIPCIÓN MEJORADA */}
      {store.description && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text style={styles.cardText} numberOfLines={4}>
            {store.description}
          </Text>
        </View>
      )}
      {store.horario && (
        <View style={styles.card}>
        <Text style={styles.cardTitle}>Horarios</Text>
          {renderHorario(store.horario)}
         </View>
       )}
       

      {/* 🛒 PRODUCTOS */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Productos</Text>
          <Text style={styles.muted}>{products.length} ítems</Text>
        </View>



        <View style={styles.grid}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id_producto}
              style={styles.prod}
              onPress={() => router.push(`/productos/${p.id_producto}`)}
            >
              <Image
                source={{
                  uri:
                    p.imagen_url?.trim() !== ""
                      ? p.imagen_url
                      : "https://placehold.co/600x400?text=Imagen",
                }}
                style={styles.prodImg}
              />
              <View style={styles.prodBody}>
                <Text numberOfLines={2} style={styles.prodTitle}>{p.nombre}</Text>
                <Text style={styles.prodPrice}>${p.precio.toLocaleString("es-CL")}</Text>
                <Text style={styles.muted}>Stock: {p.stock}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0f172a' },

  // ⭐ SKELETON
  skeletonHero: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#25314b",
    marginBottom: 20
  },
  skeletonText: {
    width: "60%",
    height: 20,
    backgroundColor: "#25314b",
    borderRadius: 6,
    marginBottom: 10
  },
  skeletonTextSmall: {
    width: "40%",
    height: 16,
    backgroundColor: "#25314b",
    borderRadius: 6,
    marginBottom: 20
  },
  skeletonCard: {
    width: "100%",
    height: 140,
    backgroundColor: "#25314b",
    borderRadius: 12
  },

  // HEADER
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#9CA3AF', marginBottom: 12 },

  // MAPA
  map: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },

  // BOTONES
  btn: { backgroundColor: '#8d6e63', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },

  // TARJETAS
  card: { padding: 16, backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cardText: { color: '#D1D5DB' },
  muted: { color: '#9CA3AF' },

  // GRID DE PRODUCTOS
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prod: {
    width: "47%",
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  prodImg: { width: '100%', height: 130, resizeMode: "cover" },
  prodBody: { padding: 10 },
  prodTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  prodPrice: { color: '#fff', marginBottom: 2 },
  horarioTexto: {
    color: "#D1D5DB",
    marginBottom: 3,
    fontSize: 14
  },

});
