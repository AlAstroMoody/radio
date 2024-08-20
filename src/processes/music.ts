export interface Wave {
  name: string
  src: string
  id: number
}

export const radioWaves: Wave[] = [
  {
    name: 'Taylor Swift',
    src: 'https://streaming.exclusive.radio/er/taylorswift/icecast.audio',
    id: 1,
  },
  {
    name: 'Exclusively Dua Lipa',
    src: 'https://streaming.exclusive.radio/er/dualipa/icecast.audio',
    id: 2,
  },
  {
    name: 'Король и Шут',
    src: 'https://pub0201.101.ru/stream/pro/aac/64/191',
    id: 3,
  },
  {
    name: 'Imagine Dragons',
    src: 'https://pub0102.101.ru:8443/stream/personal/aacp/64/1693463',
    id: 4,
  },
  {
    name: 'Linkin Park',
    src: 'https://pub0201.101.ru:8443/stream/pro/aac/64/149',
    id: 5,
  },
  {
    name: 'Queen',
    src: 'https://pub0201.101.ru:8443/stream/pro/aac/64/54',
    id: 6,
  },
  {
    name: 'Сплин',
    src: 'https://pub0102.101.ru:8443/stream/pro/aac/64/129',
    id: 7,
  },
  {
    name: 'Rock - разное',
    src: 'https://pub0102.101.ru:8443/stream/personal/aacp/64/834597',
    id: 8,
  },
]
