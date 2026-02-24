import "dotenv/config"   // 👈 PRIMERA LINEA SIEMPRE

import { supabase } from "../lib/supabase"

async function test(){

  const { data } = await supabase.from("faculties").select("*")
  console.log("READ", data)

  const { data:created } = await supabase
    .from("faculties")
    .insert([{ name:"Prueba", code:"PR" }])
    .select()

  console.log("CREATE", created)
}

test()