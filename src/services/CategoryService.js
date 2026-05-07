const CategoryRepository = require("../repositories/CategoryRepository");
const FamilyMemberRepository = require("../repositories/FamilyMemberRepository");

class CategoryService {

    async getByFamily(user_id, group_id) {
        const isMember = await FamilyMemberRepository.isMember(user_id, group_id);
        if (!isMember) {
            throw {
                status: 403,
                message: 'Acceso denegado, no perteneces a una familia'
            };
        };
        return await CategoryRepository.findByFamily(group_id)
    }
    async createCategorie(data,user_id) {
        const admin = await FamilyMemberRepository.find(user_id,data.group_id);
        console.log("ad",admin)
        if (!admin || admin.role === "member")
            throw {
                status: 403,
                message: 'Solo el administrador puede crear categorias'
            };

        const create_categories = await CategoryRepository.create({
            group_id: data.group_id,
            name: data.name,
            icon: data.icon,
            color: data.color
        });
        ///Creacion de eventos Buss
        return create_categories;
    }
}

module.exports = new CategoryService();
