const ReportService = require('../services/ReportService');
const ResponseView  = require('../views/responses/ResponseView');

class ReportController {
  async generate(req, res, next) {
    try {
      const { groupId } = req.params;
      const report = await ReportService.generateForGroup(groupId);
      return ResponseView.created(res, report, 'Reporte generado correctamente');
    } catch (err) { next(err); }
  }

  async index(req, res, next) {
    try {
      const { groupId } = req.params;
      const reports = await ReportService.getReportsForGroup(groupId);
      return ResponseView.success(res, reports);
    } catch (err) { next(err); }
  }

  async index_neew(req, res, next) {
    try {
      const { groupId } = req.params;
      const reports = await ReportService.getReportsNew(groupId);
      return ResponseView.success(res, reports);
    } catch (err) { next(err); }
  }
}

module.exports = new ReportController();
