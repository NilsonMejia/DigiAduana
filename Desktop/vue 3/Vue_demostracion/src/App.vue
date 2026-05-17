<template>
  <div>
    <h1>🌍 Agregar País</h1>
    
    <!-- Formulario para agregar país -->
    <form @submit.prevent="agregarPais">
      <div>
        <label>Nombre del país:</label>
        <input type="text" v-model="nuevoPais.nombre" required />
      </div>
      
      <div>
        <label>Capital:</label>
        <input type="text" v-model="nuevoPais.capital" required />
      </div>
      
      <div>
        <label>Población:</label>
        <input type="number" v-model="nuevoPais.poblacion" required />
      </div>
      
      <div>
        <label>Continente:</label>
        <input type="text" v-model="nuevoPais.continente" required />
      </div>
      
      <div>
        <label>Código de bandera:</label>
        <input type="text" v-model="nuevoPais.bandera_codigo" required />
      </div>
      
      <button type="submit">Guardar País</button>
    </form>
    
    <!-- Mensaje de éxito o error -->
    <div v-if="mensaje" :class="tipoMensaje">
      {{ mensaje }}
    </div>
    
    <hr />
    
    <!-- LISTA DE PAÍSES GUARDADOS -->
    <h2>📋 Países guardados ({{ paises.length }})</h2>
    
    <div v-if="cargando">Cargando países...</div>
    
    <table v-else border="1" cellpadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Capital</th>
          <th>Población</th>
          <th>Continente</th>
          <th>Bandera</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pais in paises" :key="pais.id">
          <td>{{ pais.id }}</td>
          <td>{{ pais.nombre }}</td>
          <td>{{ pais.capital }}</td>
          <td>{{ pais.poblacion }}</td>
          <td>{{ pais.continente }}</td>
          <td>🇵🇪 {{ pais.bandera_codigo }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import api from './services/api'

// Datos del nuevo país (se envía al backend)
const nuevoPais = reactive({
  nombre: '',
  capital: '',
  poblacion: '',
  continente: '',
  bandera_codigo: ''
})

// Lista de países que vienen de la base de datos
const paises = ref([])
const cargando = ref(false)
const mensaje = ref('')
const tipoMensaje = ref('') // 'exito' o 'error'

// Función para CARGAR países desde la base de datos
const cargarPaises = async () => {
  cargando.value = true
  try {
    const respuesta = await api.get('/paises')
    paises.value = respuesta.data
    console.log('Países cargados:', paises.value)
  } catch (error) {
    console.error('Error al cargar:', error)
    mensaje.value = 'Error al cargar países'
    tipoMensaje.value = 'error'
  } finally {
    cargando.value = false
  }
}

// Función para GUARDAR país en la base de datos
const agregarPais = async () => {
  // Validar que todos los campos estén llenos
  if (!nuevoPais.nombre || !nuevoPais.capital || !nuevoPais.poblacion || 
      !nuevoPais.continente || !nuevoPais.bandera_codigo) {
    mensaje.value = '❌ Todos los campos son obligatorios'
    tipoMensaje.value = 'error'
    return
  }
  
  try {
    // Enviar datos al backend (POST)
    const respuesta = await api.post('/paises', nuevoPais)
    
    console.log('Respuesta del backend:', respuesta.data)
    
    // Mostrar mensaje de éxito
    mensaje.value = `✅ País "${nuevoPais.nombre}" guardado correctamente`
    tipoMensaje.value = 'exito'
    
    // Recargar la lista de países para ver el nuevo
    await cargarPaises()
    
    // Limpiar el formulario
    nuevoPais.nombre = ''
    nuevoPais.capital = ''
    nuevoPais.poblacion = ''
    nuevoPais.continente = ''
    nuevoPais.bandera_codigo = ''
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)
    
  } catch (error) {
    console.error('Error al guardar:', error)
    mensaje.value = '❌ Error al guardar el país'
    tipoMensaje.value = 'error'
  }
}

// Cuando el componente se carga, traer los países de la base de datos
onMounted(() => {
  cargarPaises()
})
</script>

<style scoped>
div {
  margin-bottom: 10px;
}
label {
  display: inline-block;
  width: 150px;
}
input {
  padding: 5px;
  width: 200px;
}
button {
  margin-top: 10px;
  padding: 5px 15px;
  cursor: pointer;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  padding: 8px;
  text-align: left;
}
.exito {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}
.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}
</style>