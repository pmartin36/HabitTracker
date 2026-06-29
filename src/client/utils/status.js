export const STATUS_CYCLE = {
  pending: 'pass',
  pass: 'skip',
  skip: 'fail',
  fail: 'pending',
};

export function nextStatus(status) {
  return STATUS_CYCLE[status] ?? 'pass';
}
