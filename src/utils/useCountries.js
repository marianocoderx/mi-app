'use client'

import { useEffect, useState } from 'react'
import { getCountryList } from '@/utils/countries'

export default function useCountries() {
  const [list, setList] = useState([])
  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((r) => r.json())
      .then((g) => setList(getCountryList(g.features)))
      .catch(() => {})
  }, [])
  return list
}
