const FamilyService = require('../services/FamilyService');
const ResponseView = require('../views/responses/ResponseView');

class FamilyController {

    async createFamily(req, res, next) {
        try {
            const fam = await FamilyService.createFamily(req.user.id, req.body);
            res.status(201).json(fam);
        } catch (e) {
            next(e);
        }
    }

    async joinFamily(req, res, next) {
        try {
            const fam = await FamilyService.joinFamily(req.user.id, req.body.codigo);
            res.json(fam);
        } catch (e) {
            next(e);
        }
    }

    async getFamily(req, res, next) {


        try {
            const { id } = req.params;
            const fam = await FamilyService.getFamily(
                req.user.id,
                id
            ); return ResponseView.success(res, fam);
        } catch (err) { next(err); }

    }

    async removeMember(req, res, next) {
        try {
            const { id, memberId } = req.params;
            const fam = await FamilyService.removeMember(
                id,
                memberId
            ); return ResponseView.success(res, fam);

        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FamilyController();