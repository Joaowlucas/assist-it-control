
export const equipmentTypes = [
  { value: 'notebook', label: 'Notebook' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'impressora', label: 'Impressora' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'outros', label: 'Outros' }
] as const

export type EquipmentTypeValue = typeof equipmentTypes[number]['value']

interface SpecificationField {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
}

export const specificationsConfig: Record<string, SpecificationField[]> = {
  notebook: [
    { name: 'processor', label: 'Processador', type: 'text', placeholder: 'Ex: Intel Core i5, AMD Ryzen 5' },
    { name: 'ram', label: 'Memória RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD'] },
    { name: 'screen_size', label: 'Tamanho da Tela', type: 'select', options: ['13"', '14"', '15.6"', '17"'] },
    { name: 'graphics', label: 'Placa de Vídeo', type: 'text', placeholder: 'Ex: Integrada, NVIDIA GTX, AMD Radeon' }
  ],
  desktop: [
    { name: 'processor', label: 'Processador', type: 'text', placeholder: 'Ex: Intel Core i5, AMD Ryzen 5' },
    { name: 'ram', label: 'Memória RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD', '2TB HDD'] },
    { name: 'graphics', label: 'Placa de Vídeo', type: 'text', placeholder: 'Ex: Integrada, NVIDIA GTX, AMD Radeon' },
    { name: 'form_factor', label: 'Formato', type: 'select', options: ['Mini PC', 'Torre Compacta', 'Torre Média', 'Torre Completa'] }
  ],
  monitor: [
    { name: 'screen_size', label: 'Tamanho', type: 'select', options: ['21.5"', '23.8"', '27"', '32"', '34"'] },
    { name: 'resolution', label: 'Resolução', type: 'select', options: ['1920x1080 (Full HD)', '2560x1440 (2K)', '3840x2160 (4K)'] },
    { name: 'panel_type', label: 'Tipo de Painel', type: 'select', options: ['IPS', 'VA', 'TN'] },
    { name: 'connections', label: 'Conexões', type: 'text', placeholder: 'Ex: HDMI, DisplayPort, USB-C' }
  ],
  impressora: [
    { name: 'type', label: 'Tipo', type: 'select', options: ['Jato de Tinta', 'Laser', 'Matricial'] },
    { name: 'color', label: 'Cor', type: 'select', options: ['Monocromática', 'Colorida'] },
    { name: 'functions', label: 'Funções', type: 'select', options: ['Apenas Impressão', 'Multifuncional (Scanner/Cópia)'] },
    { name: 'speed', label: 'Velocidade', type: 'text', placeholder: 'Ex: 20 ppm, 30 ppm' }
  ],
  telefone: [
    { name: 'type', label: 'Tipo', type: 'select', options: ['Fixo Analógico', 'IP/VOIP', 'Sem Fio'] },
    { name: 'features', label: 'Recursos', type: 'text', placeholder: 'Ex: Viva-voz, identificador de chamadas' }
  ],
  tablet: [
    { name: 'screen_size', label: 'Tamanho da Tela', type: 'select', options: ['8"', '10"', '11"', '12.9"'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['32GB', '64GB', '128GB', '256GB'] },
    { name: 'connectivity', label: 'Conectividade', type: 'select', options: ['Wi-Fi', 'Wi-Fi + Celular'] },
    { name: 'os', label: 'Sistema Operacional', type: 'select', options: ['Android', 'iOS', 'Windows'] }
  ],
  outros: [
    { name: 'description', label: 'Descrição do Equipamento', type: 'text', placeholder: 'Descreva o equipamento necessário' },
    { name: 'specifications', label: 'Especificações', type: 'text', placeholder: 'Detalhe as especificações técnicas' }
  ]
}
