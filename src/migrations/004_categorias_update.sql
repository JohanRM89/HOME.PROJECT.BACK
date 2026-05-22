UPDATE categories
SET icon = CASE name
  WHEN 'Limpieza' THEN 'sparkles-outline'
  WHEN 'Cocina' THEN 'restaurant-outline'
  WHEN 'Compras' THEN 'cart-outline'
  WHEN 'Pagos' THEN 'card-outline'
  WHEN 'Exterior' THEN 'leaf-outline'
  WHEN 'Otro' THEN 'pricetag-outline'
  ELSE 'pricetag-outline'
END;