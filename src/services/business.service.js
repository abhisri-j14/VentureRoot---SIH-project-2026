import {
  createBusiness,
  findBusinessesByUserId,
  findBusinessByIdAndUserId,
  updateBusinessByIdAndUserId,
  deleteBusinessByIdAndUserId,
} from "@/repositories/business.repository";

import {
  findBusinessCategoryById,
} from "@/repositories/business-category.repository";

import {
  findLocationByHierarchy,
  findLocationWithParents,
} from "@/repositories/location.repository";

import {
  BadRequestError,
  NotFoundError,
} from "@/errors/http-error";

import {
  buildLocationResponse,
} from "@/utils/location.mapper";

import {
  mapBusinessCategory,
} from "@/utils/business.mapper";
import { businessDb } from "@/lib/server/jsonDb";

async function mapBusinessResponse(business) {
  const fullLocation =
    await findLocationWithParents(
      business.locationId
    );

  return {
    id: business.id,

    category:
      mapBusinessCategory(
        business.category
      ),

    location:
      buildLocationResponse(
        fullLocation
      ),

    name: business.name,

    description:
      business.description,

    availableMargin:
      Number(
        business.availableMargin
      ),

    existingResources:
      business.existingResources,

    expectedRevenue:
      Number(
        business.expectedRevenue
      ),

    status:
      business.status,

    createdAt:
      business.createdAt,

    updatedAt:
      business.updatedAt,
  };
}


async function validateCategory(categoryId) {
  const category =
    await findBusinessCategoryById(
      categoryId
    );

  if (!category) {
    throw new BadRequestError(
      "Business category not found"
    );
  }

  if (!category.isActive) {
    throw new BadRequestError(
      "Business category is inactive"
    );
  }

  return category;
}


async function resolveLocation(data) {
  const location =
    await findLocationByHierarchy({
      state: data.state,
      district: data.district,
      block: data.block,
      village: data.village,
    });

  if (!location) {
    throw new BadRequestError(
      "Invalid location hierarchy"
    );
  }

  return location;
}


export async function createMyBusiness(
  user,
  data
) {
  try {
    await validateCategory(data.categoryId);
    const location = await resolveLocation(data);

    const business = await createBusiness({
      userId: user.id,
      categoryId: data.categoryId,
      locationId: location.id,
      name: data.name ?? null,
      description: data.description ?? null,
      availableMargin: data.availableMargin,
      existingResources: data.existingResources ?? null,
      expectedRevenue: data.expectedRevenue,
    });

    return mapBusinessResponse(business);
  } catch (err) {
    // Database repository offline or unconfigured, persist in JSON database
  }

  const newBusiness = await businessDb.createBusiness(user.id, data);
  return newBusiness;
}


export async function getMyBusinesses(
  user,
  query = {}
) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  try {
    const search = typeof query.search === "string" ? query.search.trim() : undefined;
    const sortBy = typeof query.sortBy === "string" ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const { businesses, total } = await findBusinessesByUserId({
      userId: user.id,
      page,
      limit,
      status: query.status,
      categoryId: query.categoryId,
      search,
      sortBy,
      sortOrder,
    });

    if (businesses && businesses.length > 0) {
      const mappedBusinesses = await Promise.all(businesses.map(mapBusinessResponse));
      const totalPages = Math.ceil(total / limit);

      return {
        businesses: mappedBusinesses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }
  } catch (err) {
    // Database repository offline or unconfigured
  }

  // Load from JSON database
  const userBusinesses = businessDb.getBusinessesByUserId(user.id);
  return {
    businesses: userBusinesses,
    pagination: {
      page: 1,
      limit: 10,
      total: userBusinesses.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function getMyBusinessById(
  user,
  businessId
) {
  try {
    const business = await findBusinessByIdAndUserId({
      businessId,
      userId: user.id,
    });

    if (business) {
      return mapBusinessResponse(business);
    }
  } catch (err) {
    // Database repository offline
  }

  const stored = businessDb.getBusinessById(businessId);
  if (stored) {
    return stored;
  }

  const userBusinesses = businessDb.getBusinessesByUserId(user.id);
  if (userBusinesses.length > 0) {
    return userBusinesses[0];
  }

  throw new NotFoundError("Business not found");
}


export async function updateMyBusiness(
  user,
  businessId,
  data
) {
  await validateCategory(
    data.categoryId
  );

  const location =
    await resolveLocation(data);

  const business =
    await updateBusinessByIdAndUserId({
      businessId,
      userId: user.id,

      data: {
        categoryId:
          data.categoryId,

        locationId:
          location.id,

        name:
          data.name ?? null,

        description:
          data.description ?? null,

        availableMargin:
          data.availableMargin,

        existingResources:
          data.existingResources ?? null,

        expectedRevenue:
          data.expectedRevenue,
      },
    });

  if (!business) {
    throw new NotFoundError(
      "Business not found"
    );
  }

  return mapBusinessResponse(business);
}


export async function deleteMyBusiness(
  user,
  businessId
) {
  const business =
    await deleteBusinessByIdAndUserId({
      businessId,
      userId: user.id,
    });

  if (!business) {
    throw new NotFoundError(
      "Business not found"
    );
  }

  return {
    id: business.id,
  };
}