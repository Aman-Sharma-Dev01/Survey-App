import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry') || process.env.DRY_RUN === '1';

const grant = async () => {
  try {
    await connectDB();

    const regex = /@mru\.edu\.in$/i;
    const users = await User.find({ email: { $regex: regex } });

    console.log(`Found ${users.length} user(s) matching mru.edu.in`);

    if (users.length === 0) {
      console.log('No users to update. Exiting.');
      process.exit(0);
    }

    for (const u of users) {
      const needsUpdate = u.plan !== 'pro' || u.planExpiresAt !== null;
      if (needsUpdate) {
        console.log(`${DRY_RUN ? '[DRY] Would update' : 'Updating'} ${u.email} -> pro (lifetime)`);
        if (!DRY_RUN) {
          u.plan = 'pro';
          u.planActivatedAt = new Date();
          u.planExpiresAt = null; // null indicates lifetime in our model
          await u.save();
        }
      } else {
        console.log(`No change needed: ${u.email}`);
      }
    }

    console.log(DRY_RUN ? 'Dry run complete. No changes saved.' : 'Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error granting pro to mru.edu.in users:', err);
    process.exit(1);
  }
};

grant();
