import { promises } from 'fs'
import { join } from 'path'
import { xpRange } from '../lib/levelling.js'
import fs from 'fs'

function ranNumb(min, max = null) {
	if (max !== null) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	} else {
		return Math.floor(Math.random() * min) + 1
	}
}

function padLead(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}

function runtime(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

let tagsm = {}
const defaultMenu = {
	before: `%name!

⦿ 🧱 Limit : *%limit Limit*
⦿ 🦸🏼‍♂️ Role : *%role*
⦿ 🔼 Level : *%level (%exp / %maxexp)*
⦿ 💵 Money : *%money*
⦿ 💫 Total XP : %totalexp ✨

⦿ 📊 Database: %totalreg User
⦿ 📈 Uptime: *%uptime*

_Claim *.daily* atau mainkan game di *.funmenu* untuk mendapatkan exp / money_
`.trimStart(),
	header: '╭─「 %category 」',
	body: '│ • %cmd %islimit %isPremium',
	footer: '╰────\n',
}
let handler = async (m, { conn, usedPrefix: _p, __dirname, isPrems, args, usedPrefix, command }) => {
	try {
		let jam = new Date().getHours()
		let meh = padLead(ranNumb(43), 3)
		//let meh2 = ranNumb(2)
		let meh2 = 2
		let nais = fs.readFileSync(`./media/picbot/menus/menus_${meh}.jpg`)
		let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {}
		let { exp, money, limit, level, role } = global.db.data.users[m.sender]
		let { min, xp, max } = xpRange(level, global.multiplier)
		let name = await conn.getName(m.sender)
		let d = new Date(new Date + 3600000)
		let locale = 'id'
		// d.getTimeZoneOffset()
		// Offset -420 is 18.00
		// Offset    0 is  0.00
		// Offset  420 is  7.00
		let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
		let week = d.toLocaleDateString(locale, { weekday: 'long' })
		let date = d.toLocaleDateString(locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
		let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(d)
		let time = d.toLocaleTimeString(locale, {
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		})
		let _uptime = process.uptime() * 1000
		let _muptime
		if (process.send) {
			process.send('uptime')
			_muptime = await new Promise(resolve => {
				process.once('message', resolve)
				setTimeout(resolve, 1000)
			}) * 1000
		}
		let muptime = clockString(_muptime)
		//let uptime = clockString(_uptime)
		let uptime = runtime(process.uptime())
		let totalreg = Object.keys(global.db.data.users).length
		let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
		let helpm = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
			return {
				helpm: Array.isArray(plugin.tagsm) ? plugin.helpm : [plugin.helpm],
				tagsm: Array.isArray(plugin.tagsm) ? plugin.tagsm : [plugin.tagsm],
				prefix: 'customPrefix' in plugin,
				limit: plugin.limit,
				premium: plugin.premium,
				enabled: !plugin.disabled,
			}
		})
		for (let plugin of helpm)
			if (plugin && 'tagsm' in plugin)
				for (let tag of plugin.tagsm)
					if (!(tag in tagsm) && tag) tagsm[tag] = tag
		conn.menu = conn.menu ? conn.menu : {}
		let before = conn.menu.before || defaultMenu.before
		let header = conn.menu.header || defaultMenu.header
		let body = conn.menu.body || defaultMenu.body
		let footer = conn.menu.footer || defaultMenu.footer
		let _text = [
			before.replace(': *%limit', `${isPrems ? ': *Infinity' : ': *%limit'}`).replace(`%name!`, `${jam < 4 ? `*Hello %name!, 🌌 it's early in the morning*` : jam < 11 ? `*🌅 Good Morning %name!*` : jam < 14 ? `*☀️ Good Afternoon %name!*` : jam < 18 ? `*🌄 Good Evening %name!*` : `*Hello %name!, 🌖 Good Night*`}`),
			...Object.keys(tagsm).map(tag => {
				return header.replace(/%category/g, tagsm[tag]) + '\n' + [
					...helpm.filter(menu => menu.tagsm && menu.tagsm.includes(tag) && menu.helpm).map(menu => {
						return menu.helpm.map(helpm => {
							return body.replace(/%cmd/g, menu.prefix ? helpm : '%p' + helpm)
								.replace(/%islimit/g, menu.limit ? '(Limit)' : '')
								.replace(/%isPremium/g, menu.premium ? '(Premium)' : '')
								.trim()
						}).join('\n')
					}),
					footer
				].join('\n')
			})
		].join('\n')
		let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
		let replace = {
			'%': '%',
			p: _p, uptime, muptime,
			me: conn.getName(conn.user.jid),
			npmname: _package.name,
			npmdesc: _package.description,
			version: _package.version,
			exp: exp - min,
			money: money,
			maxexp: xp,
			totalexp: exp,
			xp4levelup: max - exp,
			github: _package.homepage ? _package.homepage.url || _package.homepage : '[unknown github url]',
			level, limit, name, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
			readmore: readMore
		}
		text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
		const pp = await conn.profilePictureUrl(conn.user.jid).catch(_ => './src/avatar_contact.png')
		if (meh2 == 1) {
			conn.sendHydrated(m.chat, text.trim(), packname + ' - ' + author, nais, 'https://cutt.ly/azamilaifuu', 'Minimalist ツ Sweet', null, null, [
				['Premium', '.premium'],
				['Contact', '.owner'],
				['⦿ ALL MENU ⦿', '.menuall']
			], m)
		} else {
			if (!args[0]) {
				const sections = [
					{
						title: `━ ━ ━ ━ 『 MAIN 』 ━ ━ ━ ━`,
						rows: [
							{title: '⚡ PREMIUM', rowId: usedPrefix + 'sewa', description: 'Premium, Sewabot, Jadibot, Jasa Run Bot'},
							{title: '🎫 OWNER', rowId: usedPrefix + 'owner', description: 'Chat P tidak dibalas'},
							
						]
					}, {
						title: `━ ━ ━ ━ 『 SUB MENU 』 ━ ━ ━ ━`,
						rows: [
							{title: '🎪 ALL MENU', rowId: usedPrefix + 'menuall', description: '● Menampilkan Semua Menu'},
							{title: '🎎 ANIME', rowId: usedPrefix + 'menuanime', description: '◉ Cari Manga, Anime, Random Pic'},
							{title: '⌛ DOWNLOAD', rowId: usedPrefix + 'menudownload',  description: '◎ Youtube, Facebook, Tiktok, Dll...'},
							{title: '🎮 GAMES & FUN', rowId: usedPrefix + 'menufun', description: '⊛ RPG, Kuis, Anonymous'},
							{title: '🐳 GENSHIN IMPACT', rowId: usedPrefix + 'menugenshin', description: '⊜ genshin.dev API'},
							{title: '🔞 NSFW', rowId: usedPrefix + 'menunsfw', description: '◓ Fitur Afakah Ini ?'},
							{title: '👥 GROUP', rowId: usedPrefix + 'menugroup', description: '◒ Command Dalam Grup'},
							{title: '🗺 EDITOR', rowId: usedPrefix + 'menueditor',  description: 'ⓞ Kreasi Foto'},
							{title: '💫 EPHOTO 360', rowId: usedPrefix + 'menuephoto', description: '⦿ Edit Foto Kamu'},
							{title: '👼🏻 PHOTO OXY', rowId: usedPrefix + 'menuoxy', description: '◐ Edit Photos by Oxy'},
							{title: '🎨 TEXT PRO ME', rowId: usedPrefix + 'menutextpro', description: '◑ Kreasi Teks Efek'},
						]
					}, {
						title: `━ ━ ━ ━ 『 MISC 』 ━ ━ ━ ━`,
						rows: [
							{title: '🏓 PING', rowId: usedPrefix + 'ping'},
							{title: '🚄 SPEEDTEST', rowId: usedPrefix + 'speedtest'},
							{title: '🎎 DONASI', rowId: usedPrefix + 'donasi'},
						]
					}
				]
				const listMessage = {
					text: text.trim(),
					footer: packname + ' - ' + author,
					//title: `⎔───「 ${packname} 」───⎔`,
					buttonText: `SUB MENU 🎫`,
					sections
				}
				await conn.sendMessage(m.chat, listMessage, {quoted: ftrol})
			}
		}
	} catch (e) {
		conn.reply(m.chat, 'Maaf, menu sedang error', m)
		throw e
	}
}
handler.command = /^((m(enu)?|help)(list)?|\?)$/i

handler.exp = 3

export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
	let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
	let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
	let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
	return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
