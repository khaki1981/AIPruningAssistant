export const minimumPasswordLength = 8;

export function getPasswordRequirementError(password: string) {
  return password.length < minimumPasswordLength
    ? `パスワードは${minimumPasswordLength}文字以上で入力してください。`
    : "";
}
