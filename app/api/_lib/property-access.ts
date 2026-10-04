type Viewer = {id:string;role:string;status:string;agencyId?:string|null};
type Property = {ownerAccountId:string|null;consultantAccountId:string|null;agencyId:string|null};

// Membership in an agency does not grant access to another consultant's files.
export function canManageProperty(account:Viewer|null, property:Property):boolean {
 if(!account || account.status!=="active") return false;
 return account.role==="admin" || property.ownerAccountId===account.id ||
  property.consultantAccountId===account.id ||
  (account.role==="agency" && !!account.agencyId && property.agencyId===account.agencyId);
}
