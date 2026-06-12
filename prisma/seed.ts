import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(9, 0, 0, 0)
  return d
}

async function main() {
  console.log('🧹 Nettoyage...')
  await prisma.notification.deleteMany()
  await prisma.debtPayment.deleteMany()
  await prisma.debt.deleteMany()
  await prisma.purchaseItem.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderAnalysis.deleteMany()
  await prisma.analysisOrder.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.analysisType.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.user.deleteMany()

  // ─── UTILISATEURS ────────────────────────────────────────────────────────────
  console.log('👤 Utilisateurs...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@labo.mr',
      name: 'Administrateur Système',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })
  const tech = await prisma.user.create({
    data: {
      email: 'tech@gmail.mr',
      name: 'Ahmed Ould Saleck',
      password: await bcrypt.hash('123456', 10),
      role: 'TECHNICIAN',
    },
  })

  // ─── TYPES D'ANALYSES ────────────────────────────────────────────────────────
  console.log('🔬 Types d\'analyses...')
  const [nfs, gly, crea, uree, alat, asat, chol, tg, hdl, tsh, ft4, ecbu, gs, crp, hba1c, psa, b12, fer, vitd, tp] =
    await Promise.all([
      prisma.analysisType.create({ data: { name: 'Numération Formule Sanguine (NFS)', code: 'NFS', price: 2000, category: 'Hématologie', unit: 'cellules/μL', refRangeText: 'GB: 4-10 G/L • GR: 4.5-5.5 T/L • Hb: 12-17 g/dL' } }),
      prisma.analysisType.create({ data: { name: 'Glycémie à jeun', code: 'GLY', price: 1200, category: 'Biochimie', unit: 'g/L', refRangeMin: 0.70, refRangeMax: 1.10, refRangeText: '0.70 - 1.10' } }),
      prisma.analysisType.create({ data: { name: 'Créatinémie', code: 'CREA', price: 1500, category: 'Biochimie', unit: 'mg/L', refRangeMin: 6, refRangeMax: 12, refRangeText: '6 - 12' } }),
      prisma.analysisType.create({ data: { name: 'Urée sanguine', code: 'UREE', price: 1500, category: 'Biochimie', unit: 'g/L', refRangeMin: 0.15, refRangeMax: 0.45, refRangeText: '0.15 - 0.45' } }),
      prisma.analysisType.create({ data: { name: 'ALAT (TGP)', code: 'ALAT', price: 1800, category: 'Biochimie', unit: 'UI/L', refRangeMax: 40, refRangeText: '< 40' } }),
      prisma.analysisType.create({ data: { name: 'ASAT (TGO)', code: 'ASAT', price: 1800, category: 'Biochimie', unit: 'UI/L', refRangeMax: 40, refRangeText: '< 40' } }),
      prisma.analysisType.create({ data: { name: 'Cholestérol total', code: 'CHOL', price: 1800, category: 'Biochimie', unit: 'g/L', refRangeMax: 2.0, refRangeText: '< 2.0' } }),
      prisma.analysisType.create({ data: { name: 'Triglycérides', code: 'TG', price: 1800, category: 'Biochimie', unit: 'g/L', refRangeMax: 1.5, refRangeText: '< 1.5' } }),
      prisma.analysisType.create({ data: { name: 'HDL Cholestérol', code: 'HDL', price: 2000, category: 'Biochimie', unit: 'g/L', refRangeMin: 0.40, refRangeText: '> 0.40' } }),
      prisma.analysisType.create({ data: { name: 'TSH (Thyréostimuline)', code: 'TSH', price: 3500, category: 'Hormones', unit: 'mUI/L', refRangeMin: 0.4, refRangeMax: 4.0, refRangeText: '0.4 - 4.0' } }),
      prisma.analysisType.create({ data: { name: 'FT4 (Thyroxine libre)', code: 'FT4', price: 3500, category: 'Hormones', unit: 'pmol/L', refRangeMin: 12, refRangeMax: 22, refRangeText: '12 - 22' } }),
      prisma.analysisType.create({ data: { name: 'ECBU (Cytobactériologie Urinaire)', code: 'ECBU', price: 2500, category: 'Microbiologie', unit: '', refRangeText: 'Leucocytes < 10/mm³ — Stérile' } }),
      prisma.analysisType.create({ data: { name: 'Groupe Sanguin ABO + Rhésus', code: 'GS', price: 1000, category: 'Immunologie', unit: '', refRangeText: 'N/A' } }),
      prisma.analysisType.create({ data: { name: 'CRP ultra-sensible', code: 'CRP', price: 2000, category: 'Immunologie', unit: 'mg/L', refRangeMax: 10, refRangeText: '< 10' } }),
      prisma.analysisType.create({ data: { name: 'HbA1c (Hémoglobine glyquée)', code: 'HBA1C', price: 4000, category: 'Biochimie', unit: '%', refRangeMax: 6.5, refRangeText: '< 6.5% (non diabétique)' } }),
      prisma.analysisType.create({ data: { name: 'PSA (Antigène Prostatique Spécifique)', code: 'PSA', price: 5000, category: 'Hormones', unit: 'ng/mL', refRangeMax: 4.0, refRangeText: '< 4.0' } }),
      prisma.analysisType.create({ data: { name: 'Vitamine B12', code: 'B12', price: 4500, category: 'Biochimie', unit: 'pg/mL', refRangeMin: 200, refRangeMax: 900, refRangeText: '200 - 900' } }),
      prisma.analysisType.create({ data: { name: 'Ferritine sérique', code: 'FER', price: 4000, category: 'Hématologie', unit: 'ng/mL', refRangeMin: 20, refRangeMax: 300, refRangeText: 'H: 20-300 • F: 15-150' } }),
      prisma.analysisType.create({ data: { name: 'Vitamine D (25-OH)', code: 'VITD', price: 6000, category: 'Biochimie', unit: 'ng/mL', refRangeMin: 30, refRangeMax: 100, refRangeText: '30 - 100' } }),
      prisma.analysisType.create({ data: { name: 'TP / INR (Taux de Prothrombine)', code: 'TP', price: 2500, category: 'Coagulation', unit: '%', refRangeMin: 70, refRangeMax: 100, refRangeText: '70 - 100%' } }),
    ])

  // ─── FOURNISSEURS ─────────────────────────────────────────────────────────────
  console.log('🏭 Fournisseurs...')
  const [sup1, sup2, sup3] = await Promise.all([
    prisma.supplier.create({ data: { name: 'BioMedEx Mauritanie', email: 'contact@biomedex.mr', phone: '22345678', address: 'Rue Mamadou Konaté, Tevragh-Zeina, Nouakchott' } }),
    prisma.supplier.create({ data: { name: 'LaboSupply SARL', email: 'vente@labosupply.mr', phone: '36789012', address: 'Avenue Gamal Abdel Nasser, Ksar, Nouakchott' } }),
    prisma.supplier.create({ data: { name: 'Pharmacie Médicale Sahara', email: 'pharmacie@sahara.mr', phone: '22001122', address: 'Boulevard du Général de Gaulle, Dar Naim, Nouakchott' } }),
  ])

  // ─── PRODUITS ─────────────────────────────────────────────────────────────────
  console.log('📦 Produits...')
  const [rNFS, rBIO, rHOR, tEDTA, tSEC, tCIT, gM, gL, alcool, pipette, lame] = await Promise.all([
    prisma.product.create({ data: { name: 'Réactif NFS (Hématologie)', reference: 'REACT-NFS-01', category: 'Réactifs', unit: 'kit', quantity: 5, minQuantity: 2, unitPrice: 65000 } }),
    prisma.product.create({ data: { name: 'Réactif Biochimie Multiparamètre', reference: 'REACT-BIO-01', category: 'Réactifs', unit: 'kit', quantity: 3, minQuantity: 2, unitPrice: 110000 } }),
    prisma.product.create({ data: { name: 'Réactif Hormones TSH/FT4', reference: 'REACT-HOR-01', category: 'Réactifs', unit: 'kit', quantity: 1, minQuantity: 2, unitPrice: 85000 } }),
    prisma.product.create({ data: { name: 'Tubes EDTA 5mL', reference: 'TUBE-EDTA-5', category: 'Consommables', unit: 'boîte/100', quantity: 8, minQuantity: 3, unitPrice: 12000 } }),
    prisma.product.create({ data: { name: 'Tubes sec 5mL', reference: 'TUBE-SEC-5', category: 'Consommables', unit: 'boîte/100', quantity: 4, minQuantity: 3, unitPrice: 10000 } }),
    prisma.product.create({ data: { name: 'Tubes citratés 3mL', reference: 'TUBE-CIT-3', category: 'Consommables', unit: 'boîte/100', quantity: 2, minQuantity: 3, unitPrice: 14000 } }),
    prisma.product.create({ data: { name: 'Gants vinyle taille M', reference: 'GANT-VIN-M', category: 'Protection', unit: 'boîte/100', quantity: 12, minQuantity: 5, unitPrice: 5500 } }),
    prisma.product.create({ data: { name: 'Gants vinyle taille L', reference: 'GANT-VIN-L', category: 'Protection', unit: 'boîte/100', quantity: 8, minQuantity: 5, unitPrice: 5500 } }),
    prisma.product.create({ data: { name: 'Alcool 70° 1L', reference: 'ALC-70-1L', category: 'Hygiène', unit: 'flacon', quantity: 24, minQuantity: 10, unitPrice: 1500 } }),
    prisma.product.create({ data: { name: 'Micropipettes Pasteur', reference: 'PIPE-PAST-01', category: 'Matériel', unit: 'paquet/100', quantity: 15, minQuantity: 5, unitPrice: 3000 } }),
    prisma.product.create({ data: { name: 'Lames porte-objets', reference: 'LAME-OBJ-01', category: 'Matériel', unit: 'boîte/50', quantity: 0, minQuantity: 5, unitPrice: 4500 } }),
  ])

  // ─── ACHATS & DETTES ──────────────────────────────────────────────────────────
  console.log('🛒 Achats & dettes fournisseurs...')

  // Achat 1 — BioMedEx, entièrement payé, pas de dette
  await prisma.purchase.create({
    data: {
      supplierId: sup1.id, totalAmount: 240000, paidAmount: 240000,
      purchasedAt: daysAgo(120), notes: 'Commande trimestrielle — réactifs de base',
      items: { create: [
        { productId: rNFS.id, quantity: 2, unitPrice: 65000, total: 130000 },
        { productId: rBIO.id, quantity: 1, unitPrice: 110000, total: 110000 },
      ]},
    },
  })

  // Achat 2 — BioMedEx, paiement partiel → dette PARTIAL
  const ach2 = await prisma.purchase.create({
    data: {
      supplierId: sup1.id, totalAmount: 280000, paidAmount: 150000,
      purchasedAt: daysAgo(45), notes: 'Réapprovisionnement réactifs — paiement en 2 fois',
      items: { create: [
        { productId: rNFS.id, quantity: 3, unitPrice: 65000, total: 195000 },
        { productId: rHOR.id, quantity: 1, unitPrice: 85000, total: 85000 },
      ]},
    },
  })
  const dette1 = await prisma.debt.create({
    data: {
      supplierId: sup1.id, purchaseId: ach2.id,
      amount: 130000, remaining: 80000,
      dueDate: daysAgo(-20), status: 'PARTIAL',
    },
  })
  await prisma.debtPayment.create({
    data: { debtId: dette1.id, amount: 50000, paidAt: daysAgo(25), notes: 'Premier versement' },
  })

  // Achat 3 — LaboSupply, non payé → dette PENDING (en retard !)
  const ach3 = await prisma.purchase.create({
    data: {
      supplierId: sup2.id, totalAmount: 84000, paidAmount: 0,
      purchasedAt: daysAgo(75), notes: 'Consommables urgents',
      items: { create: [
        { productId: tEDTA.id, quantity: 3, unitPrice: 12000, total: 36000 },
        { productId: tSEC.id, quantity: 2, unitPrice: 10000, total: 20000 },
        { productId: tCIT.id, quantity: 2, unitPrice: 14000, total: 28000 },
      ]},
    },
  })
  await prisma.debt.create({
    data: {
      supplierId: sup2.id, purchaseId: ach3.id,
      amount: 84000, remaining: 84000,
      dueDate: daysAgo(15), status: 'PENDING', // EN RETARD
    },
  })

  // Achat 4 — LaboSupply, entièrement payé
  await prisma.purchase.create({
    data: {
      supplierId: sup2.id, totalAmount: 71500, paidAmount: 71500,
      purchasedAt: daysAgo(180),
      items: { create: [
        { productId: gM.id, quantity: 6, unitPrice: 5500, total: 33000 },
        { productId: gL.id, quantity: 4, unitPrice: 5500, total: 22000 },
        { productId: alcool.id, quantity: 12, unitPrice: 1500, total: 18000 },
      ]},
    },
  })

  // Achat 5 — Pharmacie Sahara, dette soldée (PAID)
  const ach5 = await prisma.purchase.create({
    data: {
      supplierId: sup3.id, totalAmount: 58500, paidAmount: 58500,
      purchasedAt: daysAgo(200), notes: 'Matériel de laboratoire',
      items: { create: [
        { productId: lame.id, quantity: 5, unitPrice: 4500, total: 22500 },
        { productId: pipette.id, quantity: 5, unitPrice: 3000, total: 15000 },
        { productId: alcool.id, quantity: 14, unitPrice: 1500, total: 21000 },
      ]},
    },
  })
  const dette3 = await prisma.debt.create({
    data: {
      supplierId: sup3.id, purchaseId: ach5.id,
      amount: 58500, remaining: 0,
      dueDate: daysAgo(160), status: 'PAID',
    },
  })
  await prisma.debtPayment.create({
    data: { debtId: dette3.id, amount: 30000, paidAt: daysAgo(190), notes: 'Acompte' },
  })
  await prisma.debtPayment.create({
    data: { debtId: dette3.id, amount: 28500, paidAt: daysAgo(175), notes: 'Solde final' },
  })

  // ─── PATIENTS ─────────────────────────────────────────────────────────────────
  console.log('🧑‍⚕️ Patients...')
  const [p1, p2, p3, p4, p5, p6, p7, p8] = await Promise.all([
    prisma.patient.create({ data: { firstName: 'Mohamed', lastName: 'Ould Cheikh', dateOfBirth: new Date('1985-03-15'), gender: 'M', phone: '22112233', email: 'm.ouldcheikh@gmail.mr', address: 'Tevragh-Zeina, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Fatimetou', lastName: 'Mint Saleck', dateOfBirth: new Date('1992-07-22'), gender: 'F', phone: '36445566', address: 'Ksar, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Abdallahi', lastName: 'Ould Baye', dateOfBirth: new Date('1965-11-03'), gender: 'M', phone: '22778899', email: 'a.ouldbaye@gmail.mr', address: 'Dar Naim, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Mariem', lastName: 'Mint Sidi', dateOfBirth: new Date('2000-01-18'), gender: 'F', phone: '36102030', address: 'Arafat, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Sidi Mohamed', lastName: 'Ould Vall', dateOfBirth: new Date('1958-09-07'), gender: 'M', phone: '22405060', address: 'El Mina, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Khadijatou', lastName: 'Mint Ahmed', dateOfBirth: new Date('1978-04-25'), gender: 'F', phone: '36233445', email: 'k.mintahmed@yahoo.fr', address: 'Sebkha, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Mokhtar', lastName: 'Ould Lemrabott', dateOfBirth: new Date('1990-12-10'), gender: 'M', phone: '22667788', address: 'Toujounine, Nouakchott' } }),
    prisma.patient.create({ data: { firstName: 'Aminetou', lastName: 'Mint Babah', dateOfBirth: new Date('2005-06-30'), gender: 'F', phone: '36889900', address: 'Riadh, Nouakchott' } }),
  ])

  // ─── ORDONNANCES / ANALYSES ───────────────────────────────────────────────────
  console.log('📋 Commandes d\'analyses...')

  // CAS 1: Commande COMPLETED — entièrement payée — résultats normaux
  const ord1 = await prisma.analysisOrder.create({
    data: {
      patientId: p1.id, status: 'COMPLETED',
      totalAmount: 8500, paidAmount: 8500,
      orderedAt: daysAgo(30), completedAt: daysAgo(29),
      notes: 'Bilan de santé annuel',
      analyses: { create: [
        { analysisTypeId: nfs.id, result: '7.2 G/L / 4.8 T/L / 14.5 g/dL', flag: 'NORMAL', unit: 'cellules/μL', refRange: 'GB: 4-10 • Hb: 12-17', completedAt: daysAgo(29) },
        { analysisTypeId: gly.id, result: '0.95', flag: 'NORMAL', unit: 'g/L', refRange: '0.70 - 1.10', completedAt: daysAgo(29) },
        { analysisTypeId: chol.id, result: '1.82', flag: 'NORMAL', unit: 'g/L', refRange: '< 2.0', completedAt: daysAgo(29) },
        { analysisTypeId: tg.id, result: '1.10', flag: 'NORMAL', unit: 'g/L', refRange: '< 1.5', completedAt: daysAgo(29) },
        { analysisTypeId: crp.id, result: '3.5', flag: 'NORMAL', unit: 'mg/L', refRange: '< 10', completedAt: daysAgo(29) },
      ]},
      payments: { create: [
        { amount: 5000, method: 'CASH', paidAt: daysAgo(30), notes: 'Acompte' },
        { amount: 3500, method: 'CASH', paidAt: daysAgo(29), notes: 'Solde à la remise des résultats' },
      ]},
    },
  })

  // CAS 2: Commande COMPLETED — résultats anormaux (HIGH/LOW) — entièrement payée
  const ord2 = await prisma.analysisOrder.create({
    data: {
      patientId: p3.id, status: 'COMPLETED',
      totalAmount: 13000, paidAmount: 13000,
      orderedAt: daysAgo(20), completedAt: daysAgo(18),
      notes: 'Contrôle diabète + fonction rénale',
      analyses: { create: [
        { analysisTypeId: gly.id, result: '2.45', flag: 'HIGH', unit: 'g/L', refRange: '0.70 - 1.10', completedAt: daysAgo(18) },
        { analysisTypeId: hba1c.id, result: '9.2', flag: 'HIGH', unit: '%', refRange: '< 6.5%', completedAt: daysAgo(18) },
        { analysisTypeId: crea.id, result: '14.8', flag: 'HIGH', unit: 'mg/L', refRange: '6 - 12', completedAt: daysAgo(18) },
        { analysisTypeId: uree.id, result: '0.62', flag: 'HIGH', unit: 'g/L', refRange: '0.15 - 0.45', completedAt: daysAgo(18) },
        { analysisTypeId: nfs.id, result: '10.5 G/L / 3.9 T/L / 10.2 g/dL', flag: 'LOW', unit: 'cellules/μL', refRange: 'GB: 4-10 • Hb: 12-17', completedAt: daysAgo(18) },
      ]},
      payments: { create: [
        { amount: 13000, method: 'CARD', paidAt: daysAgo(20) },
      ]},
    },
  })

  // CAS 3: Commande COMPLETED — partiellement payée (patient doit de l'argent)
  const ord3 = await prisma.analysisOrder.create({
    data: {
      patientId: p2.id, status: 'COMPLETED',
      totalAmount: 15000, paidAmount: 8000,
      orderedAt: daysAgo(15), completedAt: daysAgo(13),
      notes: 'Bilan thyroïdien complet',
      analyses: { create: [
        { analysisTypeId: tsh.id, result: '8.9', flag: 'HIGH', unit: 'mUI/L', refRange: '0.4 - 4.0', completedAt: daysAgo(13) },
        { analysisTypeId: ft4.id, result: '9.5', flag: 'LOW', unit: 'pmol/L', refRange: '12 - 22', completedAt: daysAgo(13) },
        { analysisTypeId: nfs.id, result: '5.8 G/L / 4.2 T/L / 11.5 g/dL', flag: 'NORMAL', unit: 'cellules/μL', refRange: 'GB: 4-10 • Hb: 12-17', completedAt: daysAgo(13) },
        { analysisTypeId: chol.id, result: '2.65', flag: 'HIGH', unit: 'g/L', refRange: '< 2.0', completedAt: daysAgo(13) },
      ]},
      payments: { create: [
        { amount: 8000, method: 'CASH', paidAt: daysAgo(15), notes: 'Paiement partiel — reste 7000 MRU' },
      ]},
    },
  })

  // CAS 4: Commande IN_PROGRESS — résultats partiels — paiement partiel
  const ord4 = await prisma.analysisOrder.create({
    data: {
      patientId: p5.id, status: 'IN_PROGRESS',
      totalAmount: 17000, paidAmount: 10000,
      orderedAt: daysAgo(3),
      notes: 'Bilan préopératoire',
      analyses: { create: [
        { analysisTypeId: nfs.id, result: '6.1 G/L / 4.6 T/L / 13.8 g/dL', flag: 'NORMAL', unit: 'cellules/μL', refRange: 'GB: 4-10 • Hb: 12-17', completedAt: daysAgo(3) },
        { analysisTypeId: gs.id, result: 'B+', flag: 'NORMAL', unit: '', refRange: 'N/A', completedAt: daysAgo(3) },
        { analysisTypeId: tp.id, result: '95', flag: 'NORMAL', unit: '%', refRange: '70 - 100%', completedAt: daysAgo(3) },
        { analysisTypeId: gly.id },   // pas encore fait
        { analysisTypeId: crea.id },  // pas encore fait
        { analysisTypeId: uree.id },  // pas encore fait
      ]},
      payments: { create: [
        { amount: 10000, method: 'CASH', paidAt: daysAgo(3), notes: 'Avance' },
      ]},
    },
  })

  // CAS 5: Commande PENDING — pas de résultats, pas payé
  const ord5 = await prisma.analysisOrder.create({
    data: {
      patientId: p6.id, status: 'PENDING',
      totalAmount: 6500, paidAmount: 0,
      orderedAt: daysAgo(1),
      notes: 'Contrôle trimestriel',
      analyses: { create: [
        { analysisTypeId: gly.id },
        { analysisTypeId: hba1c.id },
        { analysisTypeId: crp.id },
      ]},
    },
  })

  // CAS 6: Commande PENDING — payée à l'avance
  const ord6 = await prisma.analysisOrder.create({
    data: {
      patientId: p4.id, status: 'PENDING',
      totalAmount: 9500, paidAmount: 9500,
      orderedAt: daysAgo(0),
      analyses: { create: [
        { analysisTypeId: nfs.id },
        { analysisTypeId: fer.id },
        { analysisTypeId: b12.id },
        { analysisTypeId: vitd.id },
      ]},
      payments: { create: [
        { amount: 9500, method: 'BANK_TRANSFER', paidAt: daysAgo(0), notes: 'Virement bancaire' },
      ]},
    },
  })

  // CAS 7: Commande CANCELLED
  const ord7 = await prisma.analysisOrder.create({
    data: {
      patientId: p7.id, status: 'CANCELLED',
      totalAmount: 5500, paidAmount: 3000,
      orderedAt: daysAgo(10),
      notes: 'Annulé — patient hospitalisé',
      analyses: { create: [
        { analysisTypeId: nfs.id },
        { analysisTypeId: crp.id },
        { analysisTypeId: gs.id },
      ]},
      payments: { create: [
        { amount: 3000, method: 'CASH', paidAt: daysAgo(10), notes: 'Acompte remboursé partiellement' },
      ]},
    },
  })

  // CAS 8: Commande COMPLETED — vieux dossier (2 mois) — bilan lipidique
  const ord8 = await prisma.analysisOrder.create({
    data: {
      patientId: p8.id, status: 'COMPLETED',
      totalAmount: 9600, paidAmount: 9600,
      orderedAt: daysAgo(60), completedAt: daysAgo(59),
      analyses: { create: [
        { analysisTypeId: chol.id, result: '2.20', flag: 'HIGH', unit: 'g/L', refRange: '< 2.0', completedAt: daysAgo(59) },
        { analysisTypeId: tg.id, result: '1.85', flag: 'HIGH', unit: 'g/L', refRange: '< 1.5', completedAt: daysAgo(59) },
        { analysisTypeId: hdl.id, result: '0.35', flag: 'LOW', unit: 'g/L', refRange: '> 0.40', completedAt: daysAgo(59) },
        { analysisTypeId: alat.id, result: '28', flag: 'NORMAL', unit: 'UI/L', refRange: '< 40', completedAt: daysAgo(59) },
        { analysisTypeId: asat.id, result: '31', flag: 'NORMAL', unit: 'UI/L', refRange: '< 40', completedAt: daysAgo(59) },
      ]},
      payments: { create: [
        { amount: 9600, method: 'CASH', paidAt: daysAgo(60) },
      ]},
    },
  })

  // CAS 9: Commande COMPLETED — PSA + NFS — homme âgé
  const ord9 = await prisma.analysisOrder.create({
    data: {
      patientId: p5.id, status: 'COMPLETED',
      totalAmount: 7000, paidAmount: 7000,
      orderedAt: daysAgo(45), completedAt: daysAgo(44),
      analyses: { create: [
        { analysisTypeId: psa.id, result: '6.8', flag: 'HIGH', unit: 'ng/mL', refRange: '< 4.0', completedAt: daysAgo(44) },
        { analysisTypeId: nfs.id, result: '5.5 G/L / 4.3 T/L / 13.2 g/dL', flag: 'NORMAL', unit: 'cellules/μL', refRange: 'GB: 4-10 • Hb: 12-17', completedAt: daysAgo(44) },
      ]},
      payments: { create: [
        { amount: 7000, method: 'CASH', paidAt: daysAgo(45) },
      ]},
    },
  })

  // ─── DÉPENSES ─────────────────────────────────────────────────────────────────
  console.log('💸 Dépenses...')
  await Promise.all([
    prisma.expense.create({ data: { description: 'Loyer local laboratoire — Juin', amount: 80000, category: 'RENT', date: daysAgo(12) } }),
    prisma.expense.create({ data: { description: 'Loyer local laboratoire — Mai', amount: 80000, category: 'RENT', date: daysAgo(42) } }),
    prisma.expense.create({ data: { description: 'Facture SOMELEC (électricité)', amount: 18500, category: 'UTILITIES', date: daysAgo(8) } }),
    prisma.expense.create({ data: { description: 'Facture eau & internet', amount: 12000, category: 'UTILITIES', date: daysAgo(8) } }),
    prisma.expense.create({ data: { description: 'Salaires personnel — Juin', amount: 150000, category: 'SALARY', date: daysAgo(12) } }),
    prisma.expense.create({ data: { description: 'Salaires personnel — Mai', amount: 150000, category: 'SALARY', date: daysAgo(42) } }),
    prisma.expense.create({ data: { description: 'Maintenance automate de biochimie', amount: 35000, category: 'MAINTENANCE', date: daysAgo(20) } }),
    prisma.expense.create({ data: { description: 'Calibration équipements', amount: 15000, category: 'EQUIPMENT', date: daysAgo(35) } }),
    prisma.expense.create({ data: { description: 'Fournitures de bureau', amount: 5500, category: 'SUPPLIES', date: daysAgo(5) } }),
    prisma.expense.create({ data: { description: 'Transport et déplacements', amount: 8000, category: 'OTHER', date: daysAgo(18) } }),
  ])

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
  console.log('🔔 Notifications...')
  await Promise.all([
    prisma.notification.create({ data: { userId: admin.id, type: 'NEW_ORDER', title: 'Nouvelle commande reçue', message: 'Commande de Khadijatou Mint Ahmed en attente de traitement', link: `/fr/orders/${ord5.id}`, read: false } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'ORDER_COMPLETED', title: 'Résultats prêts', message: 'Bilan de Mohamed Ould Cheikh — résultats disponibles', link: `/fr/orders/${ord1.id}`, read: true } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'DEBT_DUE', title: 'Dette en retard — LaboSupply', message: 'Dette de 84 000 MRU dépasse la date d\'échéance de 15 jours', read: false } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'LOW_STOCK', title: 'Stock faible — Réactif Hormones', message: 'Réactif TSH/FT4 en stock critique (1 kit restant / minimum 2)', read: false } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'LOW_STOCK', title: 'Stock épuisé — Lames porte-objets', message: 'Lames porte-objets en rupture de stock (0 / minimum 5)', read: false } }),
    prisma.notification.create({ data: { userId: admin.id, type: 'PAYMENT_RECEIVED', title: 'Paiement reçu', message: 'Virement de 9 500 MRU pour commande de Mariem Mint Sidi', read: true } }),
    prisma.notification.create({ data: { userId: tech.id, type: 'NEW_ORDER', title: 'Nouvelles analyses à traiter', message: 'Bilan préopératoire de Sidi Mohamed Ould Vall — résultats partiels attendus', link: `/fr/orders/${ord4.id}`, read: false } }),
    prisma.notification.create({ data: { userId: tech.id, type: 'ORDER_COMPLETED', title: 'Commande complétée', message: 'Bilan diabète Abdallahi Ould Baye — résultats anormaux (glycémie élevée)', link: `/fr/orders/${ord2.id}`, read: false } }),
  ])

  // ─── RÉSUMÉ ───────────────────────────────────────────────────────────────────
  console.log('\n✅ Base de données peuplée avec succès!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  COMPTES')
  console.log('  Admin    : admin@labo.mr      / admin123')
  console.log('  Technicien: tech@gmail.mr      / 123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  DONNÉES')
  console.log('  Types d\'analyses : 20')
  console.log('  Fournisseurs     : 3')
  console.log('  Produits         : 11  (2 stocks faibles, 1 rupture)')
  console.log('  Achats           : 5   (payés / partiels / en retard)')
  console.log('  Dettes fournisseurs: 3 (PAID / PARTIAL / PENDING/retard)')
  console.log('  Patients         : 8')
  console.log('  Commandes        : 9   (COMPLETED×5 / IN_PROGRESS / PENDING×2 / CANCELLED)')
  console.log('  Dépenses         : 10')
  console.log('  Notifications    : 8')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
