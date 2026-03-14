import { useCallback, useState } from "react"

interface UseStudyGroupsState {
  loading: boolean
  error: string | null
}

export function useStudyGroups() {
  const [state, setState] = useState<UseStudyGroupsState>({
    loading: false,
    error: null,
  })

  const notImplemented = useCallback(async () => {
    setState({ loading: false, error: "Grupos de estudio pendientes de implementación" })
    throw new Error("Grupos de estudio pendientes de implementación")
  }, [])

  return {
    ...state,
    createStudyGroup: notImplemented,
    getStudyGroup: notImplemented,
    createGroupEvent: notImplemented,
  }
}
