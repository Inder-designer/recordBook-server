import { Router } from 'express';
import * as record from "../../Contollers/record/record.conroller"
import * as entry from "../../Contollers/entry/entry.controller"
import { addMemberSchema, createRecordSchema, updateMemberRoleSchema, updateRecordSchema } from '../../schemas/record/record.validation';
import { validateZod } from '../../middleware/validateZod';
import { createEntrySchema, updateEntrySchema } from '../../schemas/record/enrty.validation';
const router = Router();

router.post("/create", validateZod(createRecordSchema), record.createRecord)
router.get("/", record.getUserRecords)
router.get("/:id", record.getRecordById)
router.delete("/:id", record.deleteRecord)
router.put("/:id", validateZod(updateRecordSchema), record.updateRecord)

// Members
router.post("/:recordId/members", validateZod(addMemberSchema), record.addMember)
router.delete("/:recordId/members/:memberId", record.removeMember)
router.patch(
    "/:recordId/members/:memberId/role",
    validateZod(updateMemberRoleSchema),
    record.updateMemberRole
);

// Entries
router.post("/:recordId/entries", validateZod(createEntrySchema), entry.createEntry)
router.get("/:recordId/entries", entry.getEntries)
router.get("/:recordId/entries/:entryId", entry.getEntryById)
router.put("/:recordId/entries/:entryId", validateZod(updateEntrySchema), entry.updateEntry)
router.delete("/:recordId/entries/:entryId", entry.deleteEntry)

export default router;