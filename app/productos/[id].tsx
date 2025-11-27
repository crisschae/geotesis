import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

const ORANGE = '#ff8a29';
const DARK_BG = '#111827';
const CARD_BG = '#1F2937';

export default function ProductoScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [producto, setProducto] = useState<any>(null);

  const fetchProducto = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('producto')
      .select(`
        id_producto,
        nombre,
        descripcion,
        precio,
        stock,
        sku,
        id_categoria,
        ferreteria (
          id_ferreteria,
          razon_social,
          direccion,
          latitud,
          longitud,
          telefono
        ),
        categoria (
          nombre,
          descripcion
        )
      `)
      .eq('id_producto', id)
      .single();

    if (!error) setProducto(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducto();
  }, [id]);

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );

  if (!producto)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>

      {/* ███ IMAGEN DEL PRODUCTO ███ */}
      <View style={styles.imageWrapper}>
        {producto.imagen_url ? (
          <Image
            source={{ uri: producto.imagen_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ color: '#aaa' }}>Sin imagen disponible</Text>
          </View>
        )}
      </View>

      {/* ███ INFO DEL PRODUCTO ███ */}
      <View style={styles.card}>
        <Text style={styles.productName}>{producto.nombre}</Text>

        <Text style={styles.priceText}>
          ${producto.precio?.toLocaleString('es-CL')}
        </Text>

        <Text style={styles.description}>{producto.descripcion || 'Sin descripción.'}</Text>

        <Text style={styles.metaText}>Stock disponible: {producto.stock}</Text>
        <Text style={styles.metaText}>SKU: {producto.sku}</Text>

        {producto.categoria && (
          <Text style={styles.metaText}>
            Categoría: {producto.categoria.nombre}
          </Text>
        )}
      </View>

      {/* ███ FERRETERÍA ███ */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Disponible en</Text>

        <Text style={styles.ferreteriaName}>
          🏪 {producto.ferreteria?.razon_social}
        </Text>

        <Text style={styles.ferreteriaAddress}>
          📍 {producto.ferreteria?.direccion}
        </Text>

        <Text style={styles.ferreteriaAddress}>
          📞 {producto.ferreteria?.telefono || 'No disponible'}
        </Text>

        {/* Botones */}
        <View style={{ gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push(`/ferreteria/${producto.ferreteria?.id_ferreteria}`)
            }
          >
            <Text style={styles.buttonText}>Ver ferretería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#34D399' }]}
            onPress={() => console.log('Reservar')}
          >
            <Text style={styles.buttonText}>Reservar producto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },

  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: { marginTop: 10, color: '#fff' },

  errorContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: { color: '#fff', fontSize: 16 },

  /* IMAGEN */
  imageWrapper: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* CARDS */
  card: {
    backgroundColor: CARD_BG,
    margin: 16,
    padding: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  productName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },

  priceText: {
    color: ORANGE,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
  },

  description: {
    color: '#D1D5DB',
    fontSize: 15,
    marginBottom: 10,
  },

  metaText: {
    color: '#A5A5A5',
    fontSize: 14,
    marginTop: 4,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  ferreteriaName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  ferreteriaAddress: {
    color: '#D1D5DB',
    marginBottom: 6,
  },

  button: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
