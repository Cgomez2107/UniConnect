console.log("AUTH MODULE →", auth)
import "dotenv/config"

import * as auth from "../lib/services/authService"
import * as profile from "../lib/services/profileService"



async function run(){

  console.log("\n===== TEST 1 — EMAIL INVALIDO =====")

  try{
    await auth.register("test@gmail.com","Test123456!")
    console.log("❌ ERROR: Debería haber fallado")
  }catch(e:any){
    console.log("✅ Correcto: rechazó email externo")
  }



  console.log("\n===== TEST 2 — EMAIL INSTITUCIONAL =====")

  const emailValido = "arcenio.1701625174@ucaldas.edu.co"   // ← PONLO AQUÍ
  const password = "adames7391"

  let userId:string

  try{
    const reg = await auth.register(emailValido,password)
    userId = reg.user.id
    console.log("✅ Registro correcto:", userId)
  }catch(e){
    console.log("❌ Falló registro válido")
    throw e
  }



  console.log("\n===== TEST 3 — EDITAR PERFIL SIN LOGIN =====")

  try{
    await profile.updateProfile({ bio:"Intento sin login" })
    console.log("❌ ERROR: No debería permitir editar sin login")
  }catch(e){
    console.log("✅ Correcto: no dejó editar sin sesión")
  }



  console.log("\n===== TEST 4 — LOGIN =====")

  try{
    await auth.login(emailValido,password)
    console.log("✅ Login correcto")
  }catch(e){
    console.log("❌ Login falló")
    throw e
  }

/*

  console.log("\n===== TEST 5 — CREAR PERFIL =====")

  try{
    const p = await profile.createProfile(userId,"Usuario Prueba")
    console.log("✅ Perfil creado:", p.full_name)
  }catch(e){
    console.log("❌ Falló creación perfil")
    throw e
  }



  console.log("\n===== TEST 6 — EDITAR PERFIL LOGUEADO =====")

  try{
    const updated = await profile.updateProfile({
      bio:"Bio actualizada correctamente"
    })
    console.log("✅ Perfil actualizado:", updated.bio)
  }catch(e){
    console.log("❌ No debería fallar edición con login")
    throw e
  }

*/

  console.log("\n===== TEST COMPLETADO =====")
}

run()