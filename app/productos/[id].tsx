import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabaseClient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCartStore } from "../../services/cartStore"; // 🟩 ZUSTAND

const screenWidth = Dimensions.get("window").width;

const PALETTE = Colors.palette;
const ORANGE = PALETTE.primary;
const DARK_BG = PALETTE.base;
const CARD_BG = PALETTE.soft;

type UnidadVenta = "unidad" ;

const UNIDADES: { id: UnidadVenta; label: string; descripcion: string }[] = [
  { id: "unidad", label: "Unidad", descripcion: "Precio por unidad" },
];

export default function ProductoScreen() {
  // ============================
  //  HOOKS
  // ============================
  const { id } = useLocalSearchParams();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unidad, setUnidad] = useState<UnidadVenta>("unidad");
  const [cantidad, setCantidad] = useState<string>("1");

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
        quantity: Math.max(1, parseInt(cantidad || "1", 10)),

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
        <ActivityIndicator size="large" color={ORANGE} />
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
      <View style={styles.infoCard}>
        <Text style={styles.title}>{producto.nombre}</Text>

        <Text style={styles.price}>
          ${producto.precio?.toLocaleString("es-CL")}
        </Text>

        <Text style={styles.unitText}>
          {UNIDADES.find((u) => u.id === unidad)?.descripcion ?? "Precio por unidad"}
        </Text>

        {producto.stock !== null && (
          <Text style={styles.stock}>
            Stock: {producto.stock > 0 ? producto.stock : "Agotado"}
          </Text>
        )}
      </View>

      {/* ====================== */}
      {/*  BOTÓN AGREGAR CARRITO */}
      {/* ====================== */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => {
            addToCart(productForCart!);
            router.push("/(tabs)/CartScreen");
          }}
        >
          <Text style={styles.cartBtnText}>Agregar al Carrito 🛒</Text>
        </TouchableOpacity>
        <View style={styles.qtyCompact}>
          <TouchableOpacity
            onPress={() =>
              setCantidad((prev) => {
                const num = Math.max(1, parseInt(prev || "1", 10) - 1);
                return String(num);
              })
            }
            style={styles.qtyBtnSmall}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyInputText}>{cantidad}</Text>
          <TouchableOpacity
            onPress={() =>
              setCantidad((prev) => {
                const num = Math.max(1, parseInt(prev || "1", 10) + 1);
                return String(num);
              })
            }
            style={styles.qtyBtnSmall}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    backgroundColor: DARK_BG,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK_BG,
  },
  muted: {
    color: PALETTE.textSoft,
    marginTop: 6,
  },
  error: {
    color: "#EF4444",
    fontSize: 16,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: {
    color: PALETTE.base,
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
    color: PALETTE.text,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 18,
  },
  price: {
    color: PALETTE.text,
    fontSize: 22,
    marginTop: 8,
    fontWeight: "600",
  },
  stock: {
    color: PALETTE.textSoft,
    marginTop: 4,
  },
  descripcion: {
    color: PALETTE.textSoft,
    marginTop: 12,
    fontSize: 16,
  },

  infoCard: {
    marginTop: 18,
  },

  unitText: {
    color: PALETTE.textSoft,
    marginTop: 4,
    fontSize: 13,
  },

  unitSelectorCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  unitTitle: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  unitChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PALETTE.secondary,
    backgroundColor: CARD_BG,
  },

  unitChipActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },

  unitChipText: {
    color: PALETTE.text,
    fontSize: 13,
  },

  unitChipTextActive: {
    color: PALETTE.base,
    fontWeight: "600",
  },

  // BOTÓN CARRITO
  cartBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 0,
    flex: 1,
  },
  cartBtnText: {
    textAlign: "center",
    color: PALETTE.base,
    fontSize: 18,
    fontWeight: "bold",
  },

  // Cantidad
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  qtyCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PALETTE.base,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "center",
  },
  qtyBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PALETTE.soft,
    borderWidth: 1,
    borderColor: PALETTE.border,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    color: PALETTE.text,
    fontSize: 18,
    fontWeight: "700",
  },
  qtyInputText: {
    color: PALETTE.text,
    fontSize: 16,
    fontWeight: "700",
  },

  // CARD FERRETERÍA
  card: {
    marginTop: 20,
    padding: 14,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cardTitle: {
    color: PALETTE.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardText: {
    color: PALETTE.textSoft,
    marginTop: 2,
  },
});
