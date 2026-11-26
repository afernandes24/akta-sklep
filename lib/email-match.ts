/** Czy „E-mail” i „Powtórz e-mail” są takie same (bez względu na wielkość liter i spacje). */
export function emailsMatch(a: unknown, b: unknown) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}
