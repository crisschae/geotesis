import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { useCartStore } from "../../services/cartStore"; // 🟩 ZUSTAND

const screenWidth = Dimensions.get("window").width;

export default function ProductoScreen() {
  // ============================
  //  HOOKS
  // ============================
  const { id } = useLocalSearchParams();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Zustand
  const addToCart = useCartStore((s) => s.addToCart);

  // ============================
  //  FETCH PRODUCTO
  // ============================
  const fetchProducto = async () => {
    try {
      console.log("📦 ID RECIBIDO:", id);

      const { data, error } = await supabase
        .from("producto")
        .select(
          `
          id_producto,
          nombre,
          descripcion,
          precio,
          stock,
          sku,
          imagen_url,
          imagenes,
          ferreteria (
            id_ferreteria,
            razon_social,
            direccion,
            latitud,
            longitud,
            telefono
          )
        `
        )
        .eq("id_producto", id)
        .single();

      if (error) console.log("❌ Error en Supabase:", error);

      console.log("🟦 DATA SUPABASE:", data);

      setProducto(data);
    } catch (err) {
      console.log("❌ Error inesperado:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducto();
  }, [id]);

  // ============================
  //  NORMALIZAR IMÁGENES PRO
  // ============================
  const imagenes: string[] = (() => {
    if (!producto) return [];

    // Caso 1: ya viene array real
    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      return producto.imagenes;
    }

    // Caso 2: viene como JSON string
    if (typeof producto.imagenes === "string") {
      try {
        const parsed = JSON.parse(producto.imagenes);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }

    // Caso 3: fallback a imagen_url
    return producto.imagen_url ? [producto.imagen_url] : [];
  })();

  // ============================
  //  OBJETO PARA EL CARRITO
  // ============================
  const productForCart = producto
    ? {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenes: imagenes,
        quantity: 1,

        // 🔥 AGREGAR ESTAS DOS LÍNEAS 🔥
        id_ferreteria: producto.ferreteria?.id_ferreteria,
        ferreteria: producto.ferreteria,
      }
    : null;


  // ============================
  //  CARGANDO
  // ============================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8d6e63" />
        <Text style={styles.muted}>Cargando producto...</Text>
      </View>
    );
  }

  // ============================
  //  ERROR
  // ============================
  if (!producto) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>❌ Producto no encontrado</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================
  //  RENDER
  // ============================
  return (
    <ScrollView style={styles.container}>
      {/* ====================== */}
      {/*      GALERÍA PRO       */}
      {/* ====================== */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: "100%", height: 350 }}
      >
        {imagenes.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.galeriaImg} />
        ))}
      </ScrollView>

      {/* ====================== */}
      {/*       DETALLES         */}
      {/* ====================== */}
      <Text style={styles.title}>{producto.nombre}</Text>

      <Text style={styles.price}>
        ${producto.precio?.toLocaleString("es-CL")}
      </Text>

      {producto.stock !== null && (
        <Text style={styles.stock}>
          Stock: {producto.stock > 0 ? producto.stock : "Agotado"}
        </Text>
      )}

      {producto.descripcion && (
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
      )}

      {/* ====================== */}
      {/*  BOTÓN AGREGAR CARRITO */}
      {/* ====================== */}
      <TouchableOpacity
        style={styles.cartBtn}
        onPress={() => {
          addToCart(productForCart!);
          router.push("/(tabs)/CartScreen");
        }}
      >
        <Text style={styles.cartBtnText}>Agregar al Carrito 🛒</Text>
      </TouchableOpacity>

      {/* ====================== */}
      {/*       FERRETERÍA       */}
      {/* ====================== */}
      {producto.ferreteria && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ferretería</Text>
          <Text style={styles.cardText}>🏪 {producto.ferreteria.razon_social}</Text>
          <Text style={styles.cardText}>
            📍 {producto.ferreteria.direccion}
          </Text>
          {producto.ferreteria.telefono && (
            <Text style={styles.cardText}>📞 {producto.ferreteria.telefono}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

//
// ===================================
// ESTILOS
// ===================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#111827",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  muted: {
    color: "#9CA3AF",
    marginTop: 6,
  },
  error: {
    color: "#EF4444",
    fontSize: 16,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#8d6e63",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  // GALERÍA
  galeriaImg: {
    width: screenWidth,
    height: undefined,
    aspectRatio: 1,
    resizeMode: "cover",
  },

  // TEXTOS
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 18,
  },
  price: {
    color: "#fff",
    fontSize: 22,
    marginTop: 8,
    fontWeight: "600",
  },
  stock: {
    color: "#9CA3AF",
    marginTop: 4,
  },
  descripcion: {
    color: "#D1D5DB",
    marginTop: 12,
    fontSize: 16,
  },

  // BOTÓN CARRITO
  cartBtn: {
    backgroundColor: "#8d6e63",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 22,
  },
  cartBtnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // CARD FERRETERÍA
  card: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a3443",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardText: {
    color: "#D1D5DB",
    marginTop: 2,
  },
});
