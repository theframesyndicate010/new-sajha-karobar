export function resolveBusiness(db, businessId) {
  const allBusinesses = db.businesses || [];

  if (!allBusinesses.length) {
    return null;
  }

  if (businessId) {
    return allBusinesses.find((business) => business.id === businessId) || null;
  }

  return allBusinesses[0];
}

export function ensureBusinessOrThrow(db, businessId) {
  const business = resolveBusiness(db, businessId);

  if (!business) {
    const error = new Error("Business not found");
    error.statusCode = 404;
    throw error;
  }

  return business;
}
