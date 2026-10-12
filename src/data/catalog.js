// Indicadores del Banco Mundial (datos abiertos). Se descargan al usarlos.
export const CATALOG = [
  { code: 'SP.POP.TOTL', name: 'Población total', unit: 'personas', topic: 'Demografía', log: true },
  { code: 'SP.POP.GROW', name: 'Crecimiento de la población', unit: '% anual', topic: 'Demografía' },
  { code: 'EN.POP.DNST', name: 'Densidad de población', unit: 'hab/km²', topic: 'Demografía', log: true },
  { code: 'SP.URB.TOTL.IN.ZS', name: 'Población urbana', unit: '% del total', topic: 'Demografía' },
  { code: 'SP.POP.65UP.TO.ZS', name: 'Población de 65 años o más', unit: '% del total', topic: 'Demografía' },
  { code: 'SP.DYN.TFRT.IN', name: 'Tasa de fecundidad', unit: 'hijos por mujer', topic: 'Demografía' },
  { code: 'SP.DYN.CBRT.IN', name: 'Tasa de natalidad', unit: 'por 1.000 hab.', topic: 'Demografía' },
  { code: 'SM.POP.NETM', name: 'Migración neta', unit: 'personas', topic: 'Demografía' },

  { code: 'NY.GDP.PCAP.CD', name: 'PIB per cápita', unit: 'US$ actuales', topic: 'Economía', log: true },
  { code: 'NY.GDP.MKTP.CD', name: 'PIB total', unit: 'US$ actuales', topic: 'Economía', log: true },
  { code: 'NY.GDP.MKTP.KD.ZG', name: 'Crecimiento del PIB', unit: '% anual', topic: 'Economía' },
  { code: 'FP.CPI.TOTL.ZG', name: 'Inflación', unit: '% anual', topic: 'Economía', log: false },
  { code: 'SL.UEM.TOTL.ZS', name: 'Desempleo', unit: '% fuerza laboral', topic: 'Economía' },
  { code: 'NE.EXP.GNFS.ZS', name: 'Exportaciones', unit: '% del PIB', topic: 'Economía' },
  { code: 'SI.POV.GINI', name: 'Índice de Gini (desigualdad)', unit: '0-100', topic: 'Economía' },
  { code: 'MS.MIL.XPND.GD.ZS', name: 'Gasto militar', unit: '% del PIB', topic: 'Economía' },

  { code: 'SP.DYN.LE00.IN', name: 'Esperanza de vida al nacer', unit: 'años', topic: 'Salud' },
  { code: 'SP.DYN.IMRT.IN', name: 'Mortalidad infantil', unit: 'por 1.000 nacidos', topic: 'Salud' },
  { code: 'SH.XPD.CHEX.GD.ZS', name: 'Gasto en salud', unit: '% del PIB', topic: 'Salud' },

  { code: 'SE.ADT.LITR.ZS', name: 'Alfabetización de adultos', unit: '%', topic: 'Educación' },
  { code: 'SE.XPD.TOTL.GD.ZS', name: 'Gasto en educación', unit: '% del PIB', topic: 'Educación' },

  { code: 'EN.ATM.CO2E.PC', name: 'Emisiones de CO₂ per cápita', unit: 't por persona', topic: 'Ambiente y energía' },
  { code: 'EG.FEC.RNEW.ZS', name: 'Energía renovable', unit: '% del consumo', topic: 'Ambiente y energía' },
  { code: 'EG.USE.ELEC.KH.PC', name: 'Consumo eléctrico per cápita', unit: 'kWh', topic: 'Ambiente y energía', log: true },
  { code: 'AG.LND.FRST.ZS', name: 'Superficie forestal', unit: '% del territorio', topic: 'Ambiente y energía' },

  { code: 'IT.NET.USER.ZS', name: 'Usuarios de internet', unit: '% población', topic: 'Tecnología' },
  { code: 'IT.CEL.SETS.P2', name: 'Suscripciones de celular', unit: 'por 100 hab.', topic: 'Tecnología' },
]
