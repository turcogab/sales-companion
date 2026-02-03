export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cobros: {
        Row: {
          banco: string | null
          created_at: string | null
          fecha_cheque: string | null
          hoja_ruta_parada_id: string
          id: string
          medio_pago: string
          monto: number
          numero_cheque: string | null
          observaciones: string | null
          referencia: string | null
        }
        Insert: {
          banco?: string | null
          created_at?: string | null
          fecha_cheque?: string | null
          hoja_ruta_parada_id: string
          id?: string
          medio_pago: string
          monto: number
          numero_cheque?: string | null
          observaciones?: string | null
          referencia?: string | null
        }
        Update: {
          banco?: string | null
          created_at?: string | null
          fecha_cheque?: string | null
          hoja_ruta_parada_id?: string
          id?: string
          medio_pago?: string
          monto?: number
          numero_cheque?: string | null
          observaciones?: string | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cobros_hoja_ruta_parada_id_fkey"
            columns: ["hoja_ruta_parada_id"]
            isOneToOne: false
            referencedRelation: "hoja_ruta_paradas"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones: {
        Row: {
          cantidad: number
          created_at: string | null
          detalle_motivo: string | null
          hoja_ruta_parada_id: string
          id: string
          motivo: string
          producto_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          detalle_motivo?: string | null
          hoja_ruta_parada_id: string
          id?: string
          motivo: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          detalle_motivo?: string | null
          hoja_ruta_parada_id?: string
          id?: string
          motivo?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_hoja_ruta_parada_id_fkey"
            columns: ["hoja_ruta_parada_id"]
            isOneToOne: false
            referencedRelation: "hoja_ruta_paradas"
            referencedColumns: ["id"]
          },
        ]
      }
      hoja_ruta: {
        Row: {
          created_at: string | null
          estado: string
          fecha: string
          id: string
          observaciones: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoja_ruta_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      hoja_ruta_paradas: {
        Row: {
          created_at: string | null
          estado_entrega: string
          firma_cliente: string | null
          foto_entrega: string | null
          hoja_ruta_id: string
          hora_llegada: string | null
          hora_salida: string | null
          id: string
          observaciones: string | null
          orden: number
          pedido_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado_entrega?: string
          firma_cliente?: string | null
          foto_entrega?: string | null
          hoja_ruta_id: string
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          orden?: number
          pedido_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado_entrega?: string
          firma_cliente?: string | null
          foto_entrega?: string | null
          hoja_ruta_id?: string
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          observaciones?: string | null
          orden?: number
          pedido_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoja_ruta_paradas_hoja_ruta_id_fkey"
            columns: ["hoja_ruta_id"]
            isOneToOne: false
            referencedRelation: "hoja_ruta"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones: {
        Row: {
          created_at: string | null
          diferencia: number
          fecha_cierre: string | null
          hoja_ruta_id: string
          id: string
          monto_cobrado_efectivo: number
          monto_cobrado_otros: number
          monto_esperado: number
          monto_total_cobrado: number
          observaciones: string | null
          tipo_diferencia: string | null
        }
        Insert: {
          created_at?: string | null
          diferencia?: number
          fecha_cierre?: string | null
          hoja_ruta_id: string
          id?: string
          monto_cobrado_efectivo?: number
          monto_cobrado_otros?: number
          monto_esperado?: number
          monto_total_cobrado?: number
          observaciones?: string | null
          tipo_diferencia?: string | null
        }
        Update: {
          created_at?: string | null
          diferencia?: number
          fecha_cierre?: string | null
          hoja_ruta_id?: string
          id?: string
          monto_cobrado_efectivo?: number
          monto_cobrado_otros?: number
          monto_esperado?: number
          monto_total_cobrado?: number
          observaciones?: string | null
          tipo_diferencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_hoja_ruta_id_fkey"
            columns: ["hoja_ruta_id"]
            isOneToOne: false
            referencedRelation: "hoja_ruta"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          rol: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          rol?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rol?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_usuario_id: { Args: never; Returns: string }
      is_chofer: { Args: never; Returns: boolean }
      is_route_owner: { Args: { route_id: string }; Returns: boolean }
      is_stop_owner: { Args: { stop_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
