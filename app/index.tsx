import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { db, initDB } from "../database";

type Programa = { codigo: string; nombre: string };

export default function Programas() {
  const router = useRouter();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [codigoAEliminar, setCodigoAEliminar] = useState<string | null>(null);

  useEffect(() => {
    initDB();
    cargarProgramas();
  }, []);

  const cargarProgramas = (termino = "") => {
    let result = termino
      ? db.getAllSync<Programa>(
        "SELECT * FROM programas WHERE codigo LIKE ? OR nombre LIKE ?",
        [`%${termino}%`, `%${termino}%`],
      )
      : db.getAllSync<Programa>("SELECT * FROM programas");
    setProgramas(result);
  };

  const guardarPrograma = () => {
    if (!codigo.trim() || !nombre.trim())
      return Alert.alert("Error", "Campos obligatorios");
    try {
      if (editando)
        db.runSync("UPDATE programas SET nombre = ? WHERE codigo = ?", [
          nombre.trim(),
          codigo.trim(),
        ]);
      else
        db.runSync("INSERT INTO programas (codigo, nombre) VALUES (?, ?)", [
          codigo.trim(),
          nombre.trim(),
        ]);
      cerrarModal();
      cargarProgramas();
    } catch (e) {
      Alert.alert("Error", "Código duplicado o inválido");
    }
  };

  const abrirModalEditar = (prog: Programa) => {
    setCodigo(prog.codigo);
    setNombre(prog.nombre);
    setEditando(true);
    setModalVisible(true);
  };
  const cerrarModal = () => {
    setModalVisible(false);
    setCodigo("");
    setNombre("");
    setEditando(false);
  };

  const solicitarEliminar = (cod: string) => {
    setCodigoAEliminar(cod);
    setConfirmarVisible(true);
  };

  const ejecutarEliminacion = () => {
    if (codigoAEliminar) {
      try {
        const resultado = db.getFirstSync<{ total: number }>(
          "SELECT COUNT(*) as total FROM estudiantes WHERE programa_cod = ?",
          [codigoAEliminar]
        );

        if (resultado && resultado.total > 0) {
          Alert.alert(
            "Error",
            `No se puede eliminar el programa porque tiene ${resultado.total} estudiante(s) registrado(s). Elimina primero a los estudiantes.`
          );
        } else {
          db.runSync('DELETE FROM programas WHERE codigo = ?', [codigoAEliminar]);
          cargarProgramas();
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Ocurrió un error.");
      }
    }
    setConfirmarVisible(false);
    setCodigoAEliminar(null);
  };

  return (
    <SafeAreaView style={styles.Area}>
      <View style={styles.container}>
        <View style={styles.headerCentrado}>
          <Text style={styles.titleCentrado}>Lista de Programas</Text>
        </View>



        <TextInput
          style={styles.searchInput}
          placeholder="Buscar programa..."
          value={busqueda}
          onChangeText={(t) => {
            setBusqueda(t);
            cargarProgramas(t);
          }}
        />

        <FlatList
          data={programas}
          keyExtractor={(item) => item.codigo}
          renderItem={({ item }) => (
            <View style={styles.filaTabla}>
              {/* Nombre y codigo del programa */}
              <View style={styles.columnaInfo}>
                <Text style={styles.textoPrincipal}>{item.nombre}</Text>
                <Text style={styles.textoSecundario}>{item.codigo}</Text>
              </View>

              {/*Ver  Estudiantes*/}
              <View style={styles.columnaAccionVer}>
                <TouchableOpacity
                  style={styles.botonVer}
                  onPress={() =>
                    router.push({
                      pathname: "/estudiantes",
                      params: {
                        filtroPrograma: item.codigo,
                        nombrePrograma: item.nombre,
                      },
                    })
                  }
                >
                  <Text style={styles.textoBotonRojoSm}>Ver estudiantes</Text>
                </TouchableOpacity>
              </View>

              {/* Botones */}
              <View style={styles.columnaBotones}>
                <TouchableOpacity
                  style={styles.btnIconoEditar}
                  onPress={() => abrirModalEditar(item)}
                >
                  <Ionicons name="create" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnIconoBorrar}
                  onPress={() => solicitarEliminar(item.codigo)}
                >
                  <Ionicons name="trash" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        <TouchableOpacity
          style={styles.botonCrearPrograma}
          onPress={() => {
            setEditando(false);
            setModalVisible(true);
          }}
        >
          <Text style={styles.textoBotonBlanco}>Crear nuevo programa</Text>
        </TouchableOpacity>
        {/* Modal editar*/}
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editando ? "Editar Programa" : "Nuevo Programa"}
              </Text>
              <TextInput
                style={[styles.input, editando && { backgroundColor: "#eee" }]}
                placeholder="Código"
                value={codigo}
                onChangeText={setCodigo}
                editable={!editando}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={nombre}
                onChangeText={setNombre}
              />
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarPrograma}
              >
                <Text style={styles.textoBotonBlanco}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={cerrarModal}
              >
                <Text style={styles.textoBotonBlanco}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Modal borrar */}
        <Modal visible={confirmarVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalConfirmBox}>
              <Text style={styles.confirmTitle}>¿Confirmar eliminación?</Text>
              <Text style={styles.confirmSubtitle}>
                Se borrarán todos los datos del programa.
              </Text>
              <View style={styles.filaBotonesConfirmar}>
                <TouchableOpacity
                  style={styles.btnConfirmarEliminar}
                  onPress={ejecutarEliminacion}
                >
                  <Text style={styles.textoBotonBlanco}>Sí, eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnConfirmarCancelar}
                  onPress={() => setConfirmarVisible(false)}
                >
                  <Text style={styles.textoBotonGris}>No, cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>


  );



}


const styles = StyleSheet.create({
  Area: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 25 },

  // Header
  headerCentrado: {
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  titleCentrado: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },

  // Botones
  botonCrearPrograma: {
    backgroundColor: "#5dc8ba",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  textoBotonBlanco: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },
  textoBotonRojoSm: {
    color: "#550510",
    textAlign: "center",
    margin: 2,
  },

  // Buscador
  searchInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },

  // Tabla
  filaTabla: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    justifyContent: "space-between",
  },
  columnaInfo: {
    flex: 1.5
  },
  columnaAccionVer: {
    flex: 2,
    alignItems: "center"
  },
  columnaBotones: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 5
  },
  textoPrincipal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000'
  },
  textoSecundario: {
    fontSize: 12,
    color: '#000000',
    marginTop: 3
  },


  // Botones
  botonVer: {
    backgroundColor: "#5dc8ba",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#5dc8ba",
  },
  btnIconoEditar: {
    alignItems:"center",
    backgroundColor: "#59cdbd",
    padding: 8,
    borderRadius: 20
  },
  btnIconoBorrar: {
    alignItems:"center",
    backgroundColor: "#ef6a7e",
    padding: 8,
    borderRadius: 20
  },
  textoBtnIcono: { fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#272727",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  botonGuardar: {
    backgroundColor: "#59cdbd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  botonCerrar: {
    backgroundColor: "#ef6a7e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  // --- modal borrar ---
  modalConfirmBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  filaBotonesConfirmar: {
    width: '100%',
    gap: 10,
  },
  btnConfirmarEliminar: {
    backgroundColor: '#a02c3d',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  btnConfirmarCancelar: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  textoBotonGris: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
