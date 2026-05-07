const CategoryService = require('../services/CategoryService');
const ResponseView = require('../views/responses/ResponseView');

class CategoryController {
    async getCategories(req, res, next) {
        try {
            const { group_id } = req.params;
            const userId = req.user.id;
            const categories = await CategoryService.getByFamily(userId, group_id);
            return ResponseView.success(res, categories);
        } catch (e) {
            next(e);
        }
    }
    async createCategories(req, res, next) {
        try {
         
            const categories = await CategoryService.createCategorie(req.body,req.user.id);
            return ResponseView.created(res, categories,"Categoria creada exitosamente");
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new CategoryController();