const db = require("../config/database");
const BaseRepository = require("./BaseRepository");

class CategoryRepository extends BaseRepository {
  constructor() {
    super("categories");
  }

  async createDefaults(familyId) {
    //Validar si el icono se puede poner con otras imagenes
    const cats = [
      ["Limpieza", "sparkles-outline", "#3352f0"],
      ["Cocina", "restaurant-outline", "#F5A57A"],
      ["Compras", "cart-outline", "#B8860B"],
      ["Pagos", "card-outline", "#c015b7"],
      ["Exterior", "leaf-outline", "#2E7D32"],
      ["Otro", "pricetag-outline", "#7B68EE"],
    ];

    for (const c of cats) {
      await db.query(
        `INSERT INTO categories (group_id,name,icon,color)
         VALUES ($1,$2,$3,$4)`,
        [familyId, ...c],
      );
    }
  }
  async findByFamily(familyId) {
    return this.findAll(
      { group_id: familyId },
      { orderBy: "name ASC", limit: 100 },
    );
  }
}
module.exports = new CategoryRepository();
