import { useState } from 'react';

export function useMonthNav(initialYear, initialMonth) {
  const [{ year, month }, setYearMonth] = useState({ year: initialYear, month: initialMonth });

  function navigate(delta) {
    setYearMonth(({ year: y, month: m }) => {
      const d = new Date(y, m - 1 + delta);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  return { year, month, goToPrev: () => navigate(-1), goToNext: () => navigate(1) };
}
