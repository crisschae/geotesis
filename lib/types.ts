// Tipos de ayuda para las tablas principales de la app

export type TipoCombustible = '93' | '95' | '97' | 'diesel';

export type ClienteApp = {
  id_cliente: string;
  auth_user_id: string;
  nombre: string | null;
  email: string;
  telefono: string | null;
  rut: string | null;
  direccion: string | null;
  fecha_registro: string;
  tipo_combustible: TipoCombustible | null;
  rendimiento_km_l: number | null;
  latitud: number | null;
  longitud: number | null;
};

// Usuario principal (solo portal web / rol)
export type Usuario = {
  id_usuario: string;
  nombre: string | null;
  email: string;
  rol: 'cliente' | 'ferreteria' | 'ambos';
};

export type Ferreteria = {
  id_ferreteria: string;
  rut: string | null;
  razon_social: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  api_key: string | null;
  horario_apertura: string | null; // time
  horario_cierre: string | null; // time
  estado: 'abierto' | 'cerrado';
};

export type Producto = {
  id_producto: string;
  id_ferreteria: string;
  id_categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  sku: string | null;
};

export type Pedido = {
  id_pedido: string;
  id_usuario: string;
  id_ferreteria: string;
  fecha_pedido: string;
  estado: string;
  monto_total: number;
};

export type DetallePedido = {
  id_detalle_pedido: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
  precio_unitario_com: number;
};


