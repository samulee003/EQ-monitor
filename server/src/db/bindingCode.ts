const BINDING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const BINDING_CODE_LENGTH = 6;

export function generateBindingCode(): string {
  let code = '';
  for (let i = 0; i < BINDING_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * BINDING_CODE_ALPHABET.length);
    code += BINDING_CODE_ALPHABET[index];
  }
  return code;
}
