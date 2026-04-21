import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "FastPlan";

const APP_STORE_APP_NAME = "FastPlan iOS";
const APP_STORE_BUNDLE_ID = "com.altfast.app";
const PLAY_STORE_APP_NAME = "FastPlan Android";
const PLAY_STORE_PACKAGE_NAME = "com.altfast.app";

const ENTITLEMENT_IDENTIFIER = "premium";
const ENTITLEMENT_DISPLAY_NAME = "FastPlan Premium";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

interface TierConfig {
  productId: string;
  playStoreProductId: string;
  displayName: string;
  userFacingTitle: string;
  duration: "P1W" | "P1M" | "P2M" | "P3M" | "P6M" | "P1Y" | null; // null = lifetime
  productType: "subscription" | "non_consumable";
  packageId: string;
  packageDisplayName: string;
  prices: { amount_micros: number; currency: string }[];
}

const TIERS: TierConfig[] = [
  {
    productId: "premium_monthly",
    playStoreProductId: "premium_monthly:monthly",
    displayName: "Premium Monthly",
    userFacingTitle: "Premium Monthly",
    duration: "P1M",
    productType: "subscription",
    packageId: "$rc_monthly",
    packageDisplayName: "Monthly Subscription",
    prices: [{ amount_micros: 2_990_000, currency: "GBP" }],
  },
  {
    productId: "premium_yearly",
    playStoreProductId: "premium_yearly:yearly",
    displayName: "Premium Yearly",
    userFacingTitle: "Premium Yearly",
    duration: "P1Y",
    productType: "subscription",
    packageId: "$rc_annual",
    packageDisplayName: "Yearly Subscription",
    prices: [{ amount_micros: 29_990_000, currency: "GBP" }],
  },
  {
    productId: "premium_lifetime",
    playStoreProductId: "premium_lifetime",
    displayName: "Premium Lifetime",
    userFacingTitle: "Premium Lifetime",
    duration: null,
    productType: "non_consumable",
    packageId: "$rc_lifetime",
    packageDisplayName: "Lifetime Access",
    prices: [{ amount_micros: 39_990_000, currency: "GBP" }],
  },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");
  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("Failed to create project");
    project = newProject;
    console.log("Created project:", project.id);
  }

  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) throw new Error("No apps found");

  let app: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!app) throw new Error("No app with test store found");
  console.log("Test Store app:", app.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app:", playStoreApp.id);
  }

  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  const allProductIds: string[] = [];

  for (const tier of TIERS) {
    const ensureProduct = async (
      targetApp: App,
      label: string,
      productIdentifier: string,
      isTestStore: boolean,
    ): Promise<Product> => {
      const existing = existingProducts.items?.find(
        (p) => p.store_identifier === productIdentifier && p.app_id === targetApp.id,
      );
      if (existing) {
        console.log(`${label} ${tier.displayName} exists:`, existing.id);
        return existing;
      }
      const body: CreateProductData["body"] = {
        store_identifier: productIdentifier,
        app_id: targetApp.id,
        type: tier.productType,
        display_name: tier.displayName,
      };
      if (isTestStore) {
        if (tier.productType === "subscription" && tier.duration) {
          body.subscription = { duration: tier.duration };
        }
        body.title = tier.userFacingTitle;
      }
      const { data, error } = await createProduct({
        client,
        path: { project_id: project.id },
        body,
      });
      if (error) throw new Error(`Failed to create ${label} ${tier.displayName} product: ${JSON.stringify(error)}`);
      console.log(`Created ${label} ${tier.displayName}:`, data.id);
      return data;
    };

    const testProduct = await ensureProduct(app, "Test Store", tier.productId, true);
    const appStoreProduct = await ensureProduct(appStoreApp!, "App Store", tier.productId, false);
    const playStoreProduct = await ensureProduct(playStoreApp!, "Play Store", tier.playStoreProductId, false);

    allProductIds.push(testProduct.id, appStoreProduct.id, playStoreProduct.id);

    console.log(`Setting test store prices for ${tier.displayName}`);
    const { error: priceError } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: tier.prices },
    });
    if (priceError) {
      if (
        priceError &&
        typeof priceError === "object" &&
        "type" in priceError &&
        priceError["type"] === "resource_already_exists"
      ) {
        console.log(`Prices already set for ${tier.displayName}`);
      } else {
        throw new Error(`Failed to set prices for ${tier.displayName}: ${JSON.stringify(priceError)}`);
      }
    }
  }

  // Entitlement
  let entitlement: Entitlement;
  const { data: existingEntitlements, error: listEntError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listEntError) throw new Error("Failed to list entitlements");
  const existingEnt = existingEntitlements.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEnt) {
    entitlement = existingEnt;
    console.log("Entitlement exists:", entitlement.id);
  } else {
    const { data, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    entitlement = data;
    console.log("Created entitlement:", entitlement.id);
  }

  const { error: attachEntErr } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: allProductIds },
  });
  if (attachEntErr) {
    if (attachEntErr.type === "unprocessable_entity_error") {
      console.log("Some products already attached to entitlement");
    } else {
      throw new Error("Failed to attach products to entitlement");
    }
  } else {
    console.log("Attached all products to entitlement");
  }

  // Offering
  let offering: Offering;
  const { data: existingOfferings, error: listOffErr } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOffErr) throw new Error("Failed to list offerings");
  const existingOff = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOff) {
    offering = existingOff;
    console.log("Offering exists:", offering.id);
  } else {
    const { data, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    offering = data;
    console.log("Created offering:", offering.id);
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // Packages
  const { data: existingPackages, error: listPkgErr } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPkgErr) throw new Error("Failed to list packages");

  for (const tier of TIERS) {
    let pkg: Package;
    const existingPkg = existingPackages.items?.find((p) => p.lookup_key === tier.packageId);
    if (existingPkg) {
      pkg = existingPkg;
      console.log(`Package ${tier.packageId} exists:`, pkg.id);
    } else {
      const { data, error } = await createPackages({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: tier.packageId, display_name: tier.packageDisplayName },
      });
      if (error) throw new Error(`Failed to create package ${tier.packageId}`);
      pkg = data;
      console.log(`Created package ${tier.packageId}:`, pkg.id);
    }

    const tierProductIds = allProductIds.filter((_id, idx) => {
      const tierIndex = TIERS.indexOf(tier);
      return idx >= tierIndex * 3 && idx < (tierIndex + 1) * 3;
    });

    const { error: attachErr } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: tierProductIds.map((id) => ({ product_id: id, eligibility_criteria: "all" as const })),
      },
    });
    if (attachErr) {
      if (
        attachErr.type === "unprocessable_entity_error" &&
        attachErr.message?.includes("Cannot attach product")
      ) {
        console.log(`Skipping ${tier.packageId} attach: incompatible product already attached`);
      } else {
        console.log(`Attach warning for ${tier.packageId}:`, JSON.stringify(attachErr));
      }
    } else {
      console.log(`Attached products to ${tier.packageId}`);
    }
  }

  const { data: testKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: app.id } });
  const { data: appStoreKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appStoreApp!.id } });
  const { data: playStoreKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: playStoreApp!.id } });

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", app.id);
  console.log("App Store App ID:", appStoreApp!.id);
  console.log("Play Store App ID:", playStoreApp!.id);
  console.log("Entitlement:", ENTITLEMENT_IDENTIFIER);
  console.log("Test API Key:", testKeys?.items.map((k) => k.key).join(", "));
  console.log("iOS API Key:", appStoreKeys?.items.map((k) => k.key).join(", "));
  console.log("Android API Key:", playStoreKeys?.items.map((k) => k.key).join(", "));
  console.log("====================\n");
}

seedRevenueCat().catch((e) => {
  console.error(e);
  process.exit(1);
});
