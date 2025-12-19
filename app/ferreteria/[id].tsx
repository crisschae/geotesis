// app/ferreteria/[id].tsx
import Colors from "@/constants/Colors";
import { supabase } from '@/lib/supabaseClient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from "react-native-maps";

const PALETTE = Colors.palette;

export default function FerreteriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showFullHorario, setShowFullHorario] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);


  // HEADER PERSONALIZADO ⭐
  useLayoutEffect(() => {
    navigation.setOptions({
      title: store?.name || "Cargando…",
      headerStyle: { backgroundColor: PALETTE.soft },
      headerTintColor: PALETTE.primary,
      headerTitleStyle: { fontWeight: "bold", color: PALETTE.text },
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
      

      const horarioParsed =
        typeof sData.horario === "string"
          ? (() => {
              try {
                return JSON.parse(sData.horario);
              } catch {
                return null;
              }
            })()
          : sData.horario;

      setStore({
        id: sData.id_ferreteria,
        name: sData.razon_social,
        address: sData.direccion,
        phone: sData.telefono,
        lat: sData.latitud,
        lng: sData.longitud,
        horario: horarioParsed,
        descripcion: sData.descripcion,
        rating_avg: sData.rating_avg,
      });

      // 2️⃣ OBTENER PRODUCTOS
      const { data: pData } = await supabase
        .from("producto")
        .select("*")
        .eq("id_ferreteria", sData.id_ferreteria);

      setProducts(pData || []);
      const { data: reviewsData, error: rErr } = await supabase
        .from("resenas")
        .select(`
          id_resena,
          rating,
          comentario,
          fecha
          
        `)
        .eq("id_ferreteria", sData.id_ferreteria)
        .order("fecha", { ascending: false });
      
      


      if (!rErr) {
        setReviews(reviewsData || []);
      }
      setLoading(false);
    };
    
    

      // --- RESEÑAS -

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
        <Text style={styles.error}>❌ {err ?? "Error desconocido"}</Text>

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
  function getEstadoActual(horario: any) {
    const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    
    const ahora = new Date();
    const diaActual = dias[ahora.getDay()];
    const h = horario[diaActual];

    if (!h || h.abre == null || h.cierra == null) {
      return { estado: "cerrado", mensaje: "Cerrado hoy" };
    }

    const [abreH, abreM] = String(h.abre).split(":").map(Number);
    const [cierraH, cierraM] = String(h.cierra).split(":").map(Number);

    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
    const abreMin = abreH * 60 + abreM;
    const cierraMin = cierraH * 60 + cierraM;

    if (ahoraMin < abreMin) {
      return { estado: "cerrado", mensaje: `Abre a las ${h.abre}` };
    }

    if (ahoraMin > cierraMin) {
      return { estado: "cerrado", mensaje: "Cerrado ahora" };
    }

    // Está abierto → calcular cuánto falta para cerrar
    const resta = cierraMin - ahoraMin;
    const horas = Math.floor(resta / 60);
    const minutos = resta % 60;

    let info = "Abierto ahora";
    if (horas > 0) info += ` • Cierra en ${horas}h ${minutos}m`;
    else info += ` • Cierra en ${minutos}m`;
    

    return { estado: "abierto", mensaje: info };
  }
  // Estado actual del local
  const estado = store.horario ? getEstadoActual(store.horario) : null;




  const mapsUrl =
    store.lat && store.lng
      ? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`;
    

  return (
    
    <ScrollView style={styles.container}>
    
      
      {/* 🔨 HEADER FERRETERÍA */}
      {/* ⭐ Rating resumen */}
      {store.rating_avg != null ? (
        <Text style={styles.rating}>
          ⭐ {store.rating_avg.toFixed(1)} / 5    {store.rating_count} 
        </Text>
      ) : (
        <Text style={styles.noRating}>Sin reseñas todavía</Text>
      )}
      

      <Text style={styles.title}>{store.name}</Text>
      <Text style={styles.subtitle}>📍 {store.address}</Text>
      {store.phone && (
        <Text style={styles.subtitle}>📞 {store.phone}</Text>
      )}


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
      {store.descripcion && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>

          <Text
            style={styles.cardText}
            numberOfLines={showFullDesc ? undefined : 3}  // <-- aquí se corta
          >
            {store.descripcion}
          </Text>

          {/* Botón Ver más / Ver menos */}
          <TouchableOpacity
            onPress={() => setShowFullDesc(!showFullDesc)}
            style={{ marginTop: 6 }}
          >
            <Text style={styles.verMas}>
              {showFullDesc ? "Ver menos ▲" : "Ver más ▼"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
        {estado && (
          <Text
            style={{
              color: estado.estado === "abierto" ? "#4ade80" : "#ef4444",
              fontWeight: "700",
              marginTop: 8,
              marginBottom: 4
            }}
          >
            {estado.mensaje}
          </Text>
        )}

      
      {store.horario && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horarios</Text>

          <View>
            {showFullHorario
              ? renderHorario(store.horario)
              : renderHorario(store.horario).slice(0, 2)}
          </View>

          <TouchableOpacity
            onPress={() => setShowFullHorario(!showFullHorario)}
            style={{ marginTop: 6 }}
          >
            <Text style={styles.verMas}>
              {showFullHorario ? "Ver menos ▲" : "Ver más ▼"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

       

      {/* 🛒 PRODUCTOS */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle,{ marginBottom: 10 }]}>Productos</Text>
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reseñas</Text>

        {reviews.length === 0 && (
          <Text style={styles.noRating}>Aún no hay reseñas para esta ferretería.</Text>
        )}

        {reviews.map((r) => (
          <View key={r.id_resena} style={styles.reviewItem}>
            <Text style={styles.reviewRating}>⭐ {r.rating}.0</Text>

            {r.comentario && (
              <Text style={styles.reviewComment}>{r.comentario}</Text>
            )}

            <Text style={styles.reviewDate}>
              {new Date(r.fecha).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 16,
  backgroundColor: PALETTE.base,
  },


  // ⭐ SKELETON
  skeletonHero: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: PALETTE.accentLight,
    marginBottom: 20
  },
  skeletonText: {
    width: "60%",
    height: 20,
    backgroundColor: PALETTE.accentLight,
    borderRadius: 6,
    marginBottom: 10
  },
  skeletonTextSmall: {
    width: "40%",
    height: 16,
    backgroundColor: PALETTE.accentLight,
    borderRadius: 6,
    marginBottom: 20
  },
  skeletonCard: {
    width: "100%",
    height: 140,
    backgroundColor: PALETTE.accentLight,
    borderRadius: 12
  },

  // HEADER
  title: { color: PALETTE.text, fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: PALETTE.textSoft, marginBottom: 12 },

  // MAPA
  map: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },

  // BOTONES
  btn: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom:6,
    textAlign:"center",
    justifyContent:"center",
    
  },
    btnText: {
    color: PALETTE.base,
    fontWeight: "700",
    textAlign: "center",
  },

  // TARJETAS
  card: {
    padding:10,
    backgroundColor: PALETTE.soft,
    borderRadius: 24,           // más redondeado como index
    marginBottom: 16,
  },

  cardHead: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: PALETTE.text, fontSize: 18, fontWeight: '600' },
  cardText: { color: PALETTE.textSoft },
  muted: { color: PALETTE.textSoft },

  // GRID DE PRODUCTOS
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prod: {
    width: "47%",
    backgroundColor: PALETTE.base,
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
  prodTitle: { color: PALETTE.text, fontWeight: '600', marginBottom: 10 },
  prodPrice: { color: PALETTE.text, marginBottom: 2 },
  horarioTexto: {
    color: PALETTE.textSoft,
    marginBottom: 3,
    fontSize: 14
  },
  error: {
  color: "#EF4444",
  fontSize: 16,
  marginBottom: 12,
  fontWeight: "600",
  textAlign: "center"
  },
  center: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: PALETTE.base,
  padding: 20,
},
verMas: {
  color: PALETTE.primary,
  fontWeight: "600",
  marginTop: 4,
},

rating: {
  color: "#FBBF24",     // dorado suave, estilo estrella
  fontSize: 16,
  fontWeight: "600",
  marginTop: 4,
  marginBottom: 4,
},
  reviewItem: {
  marginTop: 10,
  padding: 10,
  backgroundColor: PALETTE.soft,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: PALETTE.border,
},

reviewRating: {
  color: "#FBBF24",
  fontWeight: "700",
  fontSize: 16,
  marginBottom: 4,
},

reviewComment: {
  color: PALETTE.textSoft,
  fontSize: 14,
  marginBottom: 6,
},

reviewDate: {
  color: PALETTE.textSoft,
  fontSize: 12,
},
noRating: {
  color: PALETTE.textSoft,        // gris suave
  fontSize: 14,
  fontStyle: "italic",     // estilo “sin reseñas”
  marginTop: 4,
  marginBottom: 4,
},




});
