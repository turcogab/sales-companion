// IndexedDB para almacenamiento offline
const DB_NAME = 'preventista_db';
const DB_VERSION = 1;

export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  limite_credito: number;
  saldo: number;
  condicion_fiscal: string;
  lista_precios: string;
  latitud?: number;
  longitud?: number;
  orden_ruta?: number;
  sincronizado: boolean;
  updated_at: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen_url?: string;
  sincronizado: boolean;
  updated_at: string;
}

export interface ItemPedido {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  items: ItemPedido[];
  total: number;
  estado: 'pendiente' | 'sincronizado' | 'procesado' | 'entregado';
  notas?: string;
  created_at: string;
  sincronizado: boolean;
}

export interface Cobranza {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  monto: number;
  tipo_pago: 'efectivo' | 'transferencia' | 'cheque';
  referencia?: string;
  notas?: string;
  created_at: string;
  sincronizado: boolean;
}

export interface SyncStatus {
  clientes: { total: number; pendientes: number };
  productos: { total: number; pendientes: number };
  pedidos: { total: number; pendientes: number };
  cobranzas: { total: number; pendientes: number };
  lastSync: string | null;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Clientes
      if (!database.objectStoreNames.contains('clientes')) {
        const clientesStore = database.createObjectStore('clientes', { keyPath: 'id' });
        clientesStore.createIndex('codigo', 'codigo', { unique: true });
        clientesStore.createIndex('nombre', 'nombre', { unique: false });
        clientesStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        clientesStore.createIndex('orden_ruta', 'orden_ruta', { unique: false });
      }

      // Productos
      if (!database.objectStoreNames.contains('productos')) {
        const productosStore = database.createObjectStore('productos', { keyPath: 'id' });
        productosStore.createIndex('codigo', 'codigo', { unique: true });
        productosStore.createIndex('nombre', 'nombre', { unique: false });
        productosStore.createIndex('categoria', 'categoria', { unique: false });
        productosStore.createIndex('sincronizado', 'sincronizado', { unique: false });
      }

      // Pedidos
      if (!database.objectStoreNames.contains('pedidos')) {
        const pedidosStore = database.createObjectStore('pedidos', { keyPath: 'id' });
        pedidosStore.createIndex('cliente_id', 'cliente_id', { unique: false });
        pedidosStore.createIndex('estado', 'estado', { unique: false });
        pedidosStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        pedidosStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Cobranzas
      if (!database.objectStoreNames.contains('cobranzas')) {
        const cobranzasStore = database.createObjectStore('cobranzas', { keyPath: 'id' });
        cobranzasStore.createIndex('cliente_id', 'cliente_id', { unique: false });
        cobranzasStore.createIndex('sincronizado', 'sincronizado', { unique: false });
        cobranzasStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Config
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
};

// Generic CRUD operations
export const getAll = async <T>(storeName: string): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getById = async <T>(storeName: string, id: string): Promise<T | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const put = async <T>(storeName: string, data: T): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = async (storeName: string, id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getByIndex = async <T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const countByIndex = async (
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<number> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.count(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const [
    clientesTotal,
    clientesPendientes,
    productosTotal,
    productosPendientes,
    pedidosTotal,
    pedidosPendientes,
    cobranzasTotal,
    cobranzasPendientes
  ] = await Promise.all([
    getAll('clientes').then(items => items.length),
    countByIndex('clientes', 'sincronizado', false as unknown as IDBValidKey),
    getAll('productos').then(items => items.length),
    countByIndex('productos', 'sincronizado', false as unknown as IDBValidKey),
    getAll('pedidos').then(items => items.length),
    countByIndex('pedidos', 'sincronizado', false as unknown as IDBValidKey),
    getAll('cobranzas').then(items => items.length),
    countByIndex('cobranzas', 'sincronizado', false as unknown as IDBValidKey),
  ]);

  const config = await getById<{ key: string; value: string }>('config', 'lastSync');

  return {
    clientes: { total: clientesTotal, pendientes: clientesPendientes },
    productos: { total: productosTotal, pendientes: productosPendientes },
    pedidos: { total: pedidosTotal, pendientes: pedidosPendientes },
    cobranzas: { total: cobranzasTotal, pendientes: cobranzasPendientes },
    lastSync: config?.value || null,
  };
};

export const setLastSync = async (): Promise<void> => {
  await put('config', { key: 'lastSync', value: new Date().toISOString() });
};

// Helper to generate IDs
export const generateId = (): string => {
  return crypto.randomUUID();
};
