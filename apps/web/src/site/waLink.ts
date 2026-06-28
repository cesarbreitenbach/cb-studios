const DEFAULT_MSG = 'Olá! Vim pelo site e gostaria de agendar um horário 💕';
export function waLink(whatsapp: string, message: string = DEFAULT_MSG): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
