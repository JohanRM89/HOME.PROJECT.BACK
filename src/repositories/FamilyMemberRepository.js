const db = require('../config/database');

class FamilyMemberRepository {

  async find(userId, familyId) {
    const { rows } = await db.query(
      `SELECT * FROM user_groups 
       WHERE user_id=$1 AND group_id=$2`,
      [userId, familyId]
    );
    return rows[0] || null;
  }

  async findByUser(userId) {
    const { rows } = await db.query(
      `SELECT * FROM user_groups WHERE user_id=$1`,
      [userId]
    );
    return rows[0] || null;
  }

  async addMember(data) {
    await db.query(
      `INSERT INTO user_groups (user_id, group_id, role)
       VALUES ($1,$2,$3)`,
      [data.user_id, data.group_id, data.role]
    );
  }

  async getMembers(familyId) {
    const { rows } = await db.query(`
      SELECT u.name, u.email,
             mf.role, mf.points_accumulated, mf.joined_at
      FROM users u
      JOIN user_groups mf ON u.id=mf.user_id
      WHERE mf.group_id=$1
      ORDER BY mf.role DESC, u.name
    `, [familyId]);

    return rows;
  }

  async remove(userId, familyId) {
    await db.query(
      `DELETE FROM user_groups WHERE user_id=$1 AND group_id=$2`,
      [userId, familyId]
    );
  }


  async isMember(userId, familyId) {
    const { rows } = await db.query(
      `SELECT 1 FROM user_groups
       WHERE user_id = $1 AND group_id = $2`,
      [userId, familyId]
    );
    return rows.length > 0;
  };
  async getMemberid(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM user_groups
       WHERE user_id = $1 `,
      [user_id]
    );
    return rows[0] || null;

  }


}

module.exports = new FamilyMemberRepository();