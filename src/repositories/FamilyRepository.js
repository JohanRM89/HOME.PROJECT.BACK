
const BaseRepository = require('./BaseRepository');
const db  = require('../config/database');

class FamilyRepository extends BaseRepository {
  constructor() {
    super('family_groups');
  }

  async findByCode(code) {
    return this.findOne({ invitation_code: code.toUpperCase() });
  }

  async generateUniqueCode() {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await this.findByCode(code));
    return code;
  }

  async create (data){
  
  const { rows } = await db.query(
    `INSERT INTO family_groups (name, created_by, invitation_code)
     VALUES ($1, $2, $3)
     RETURNING id, name, created_by, invitation_code, created_at`,
    [data.name, data.created_by, data.invitation_code]
  );

  return rows[0];

  }
}

module.exports = new FamilyRepository();
