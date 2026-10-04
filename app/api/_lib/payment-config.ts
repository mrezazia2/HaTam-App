type GatewaySettings={enabled:boolean;encryptedSecret:string|null;publicConfig:Record<string,string>};

const requiredFields=["requestUrl","verifyUrl","paymentUrlTemplate","callbackUrl","authorityPath","verifyCodePath"] as const;

export function gatewayConfigured(settings:GatewaySettings|null|undefined){
  if(!settings)return false;
  const config=settings.publicConfig||{};
  return requiredFields.every(field=>Boolean(config[field]?.trim()))&&Boolean(config.merchantId?.trim()||settings.encryptedSecret);
}

export function gatewayAvailable(settings:GatewaySettings|null|undefined){
  return Boolean(settings?.enabled&&gatewayConfigured(settings));
}
