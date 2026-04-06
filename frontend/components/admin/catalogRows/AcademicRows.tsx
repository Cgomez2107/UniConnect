import { Colors } from "@/constants/Colors";
import type { Faculty, Program, Subject } from "@/types";
import { Animated, Text, View } from "react-native";
import { RowActions } from "./RowActions";
import { styles, useEntryAnim } from "./shared";

interface FacultyRowProps {
  item: Faculty;
  index: number;
  programsCount: number;
  onEdit: () => void;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function FacultyRow({ item, index, programsCount, onEdit, onDelete, C }: FacultyRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}> 
        <View style={[styles.indexBox, { backgroundColor: C.primary + "15" }]}>
          <Text style={[styles.indexText, { color: C.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: C.textSecondary }]}> 
            {programsCount} programa{programsCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </View>
    </Animated.View>
  );
}

interface ProgramRowProps {
  item: Program;
  index: number;
  subjectsCount: number;
  onEdit: () => void;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function ProgramRow({ item, index, subjectsCount, onEdit, onDelete, C }: ProgramRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}> 
        <View style={[styles.indexBox, { backgroundColor: (C as any).accent + "30" }]}>
          <Text style={[styles.indexText, { color: (C as any).accentDark }]}>{index + 1}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
          <View style={styles.tagsRow}>
            {item.faculty_name && (
              <View style={[styles.tag, { backgroundColor: C.primary + "12" }]}> 
                <Text style={[styles.tagText, { color: C.primary }]}>{item.faculty_name}</Text>
              </View>
            )}
            <Text style={[styles.meta, { color: C.textSecondary }]}> 
              {subjectsCount} materia{subjectsCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </View>
    </Animated.View>
  );
}

interface SubjectRowProps {
  item: Subject;
  programs: Program[];
  onEdit: () => void;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function SubjectRow({ item, programs, onEdit, onDelete, C }: SubjectRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}> 
        <View style={[styles.info, { flex: 1 }]}>
          <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
          <View style={styles.tagsRow}>
            {programs.length === 0 ? (
              <Text style={[styles.meta, { color: C.textPlaceholder }]}>Sin programas vinculados</Text>
            ) : (
              programs.map((p) => (
                <View key={p.id} style={[styles.tag, { backgroundColor: C.primary + "12" }]}> 
                  <Text style={[styles.tagText, { color: C.primary }]}>{p.name}</Text>
                </View>
              ))
            )}
          </View>
        </View>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </View>
    </Animated.View>
  );
}
