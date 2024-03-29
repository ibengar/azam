import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (m.isGroup) return m.reply(`[ private chat only ]`)
    try {
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let ini_txt = `${year + month + date + "_" + hours + minutes + seconds}`

        let database = await fs.readFileSync(`./database.json`)
        let session = await fs.readFileSync(`./session.data.json`)
	    await conn.sendMessage(m.chat, {document: database, mimetype: 'application/json', fileName: `database_azami_${ini_txt}.json`}, { quoted : m })
        await conn.sendMessage(m.chat, {document: session, mimetype: 'application/json', fileName: `session_azami_${ini_txt}.json`}, { quoted : m })
    } catch (e) {
    	console.log(e)
    	m.reply(`Terjadi kesalahan, coba lagi.`)
    }
}

handler.menudownload = ['database']
handler.tagsdownload = ['search']
handler.command = /^(data(base)?|backup)$/i

handler.owner = true

export default handler