import { IndicatorBadge } from "@/components/perfil/IndicatorBadge"
import { StatBox } from "@/components/shared/StatBox"
import { Colors } from "@/constants/Colors"
import type { IndicadoresEstadisticas } from "@/types"
import { StyleSheet, useColorScheme, View } from "react-native"

interface Props {
  requestsCount: number
  subjectsCount: number
  groupsCount?: number
  /** D02: si el backend envió indicadores decorados, se renderizan con IndicatorBadge */
  indicadores?: IndicadoresEstadisticas
}

export function StatsRow({
  requestsCount,
  subjectsCount,
  groupsCount = 0,
  indicadores,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  if (indicadores) {
    return (
      <View
        style={[
          styles.row,
          { borderColor: C.border, backgroundColor: C.surface },
        ]}
      >
        <IndicatorBadge icon="📊" label="Grupos creados" value={indicadores.gruposBajoAdministracion} />
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <IndicatorBadge icon="👥" label="Participa" value={indicadores.gruposParticipa} />
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <IndicatorBadge icon="💬" label="Mensajes" value={indicadores.mensajesEnviados} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.row,
        { borderColor: C.border, backgroundColor: C.surface },
      ]}
    >
      <StatBox label="Publicaciones" value={String(requestsCount)} />
      {groupsCount > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <StatBox label="Grupos" value={String(groupsCount)} />
        </>
      )}
      <View style={[styles.divider, { backgroundColor: C.border }]} />
      <StatBox label="Materias" value={String(subjectsCount)} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { width: 1 },
})
