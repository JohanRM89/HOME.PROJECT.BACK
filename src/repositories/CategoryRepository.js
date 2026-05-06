const db = require('../config/database');

class CategoryRepository {

  async createDefaults(familyId) {
    //Validar si el icono se puede poner con otras imagenes 
    const cats = [
      ['Limpieza','🧹','#E85C2B'],
      ['Cocina','🍳','#F5A57A'],
      ['Compras','🛒','#B8860B'],
      ['Pagos','💳','#1565C0'],
      ['Exterior','🌿','#2E7D32'],
      ['Otro','📌','#7B68EE']
    ];

    for (const c of cats) {
      await db.query(
        `INSERT INTO categories (group_id,name,icon,color)
         VALUES ($1,$2,$3,$4)`,
        [familyId, ...c]
      );
    }
  }
}
module.exports = new CategoryRepository();