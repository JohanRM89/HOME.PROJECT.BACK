const FamilyRepository = require('../repositories/FamilyRepository');
const FamilyMemberRepository = require('../repositories/FamilyMemberRepository');
const CategoryRepository = require('../repositories/CategoryRepository');

class FamilyService {

    async createFamily(userId, { name }) {
        if (!name || !name.trim())
            throw { status: 400, message: 'Nombre requerido' };

        const belongs = await FamilyMemberRepository.findByUser(userId);
        if (belongs)
            throw { status: 409, message: 'Ya perteneces a una familia' };

        const code = await FamilyRepository.generateUniqueCode();

        const family = await FamilyRepository.create({
            name: name.trim(),
            created_by: userId,
            invitation_code: code
        });
        await FamilyMemberRepository.addMember({
            user_id: userId,
            group_id: family.id,
            role: "admin"
        });

        await CategoryRepository.createDefaults(family.id);

        // Aquí puedes emitir eventos (Observer)
        // EventBus.emit('family.created', {...})

        return family;
    }

    async joinFamily(userId, code) {
        if (!code)
            throw { status: 400, message: 'Código requerido' };

        const belongs = await FamilyMemberRepository.findByUser(userId);
        if (belongs)
            throw { status: 409, message: 'Ya perteneces a una familia' };

        const family = await FamilyRepository.findByCode(code);
        if (!family)
            throw { status: 404, message: 'Código inválido' };

        await FamilyMemberRepository.addMember({
            user_id: userId,
            group_id: family.id,
            role: "member"
        });

        return family;
    }

    async getFamily(userId, familyId) {
        const member = await FamilyMemberRepository.find(userId, familyId);
        if (!member)
            throw { status: 403, message: 'Acceso denegado' };

        const family = await FamilyRepository.findById(familyId);
        const members = await FamilyMemberRepository.getMembers(familyId);

        family.miembros = members;
        return family;
    }

    async removeMember(requesterId, familyId) {
        const admin = await FamilyMemberRepository.find(requesterId, familyId);
        console.log("ad",admin)
        if (!admin || !admin.es_admin)
            throw {
                status: 403,
                message: 'Solo el administrador puede remover miembros'
            };

        await FamilyMemberRepository.remove(memberId, familyId);
    }
}

module.exports = new FamilyService();