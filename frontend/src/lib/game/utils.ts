export function flipFieldXIfRed(x: number, heroTeam: string, nFieldsWidth: number): number {
  if (heroTeam != "red") return x;
  else return nFieldsWidth - 1 - x;
}

export function flipFieldYIfRed(y: number, heroTeam: string, nFieldsHeight: number): number {
  if (heroTeam != "red") return y;
  else return nFieldsHeight - 1 - y;
}
