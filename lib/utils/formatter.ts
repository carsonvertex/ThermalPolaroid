export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1; // 0-indexed, so add 1
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

export const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };