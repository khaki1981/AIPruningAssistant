import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AccountSettingsPage from "./AccountSettingsPage";
import AuthPage from "./AuthPage";
import type { AuthMode } from "./AuthPage";
import MyPlantEditPage from "./MyPlantEditPage";
import MyPlantCareHistoryPage from "./MyPlantCareHistoryPage";
import MyPlantCareRecordPage from "./MyPlantCareRecordPage";
import MyPlantsPage from "./MyPlantsPage";
import {
  PasswordResetRequestPage,
  PasswordResetUpdatePage,
} from "./PasswordResetPage";
import PlantListPage from "./PlantListPage";
import PlantPhotoIdentificationPage from "./PlantPhotoIdentificationPage";
import { useAuth } from "./auth/AuthContext";
import {
  deleteCurrentAccount,
  type AccountDeletionFailureCode,
} from "./data/accountDeletion";
import { loadPlants } from "./data/loadPlants";

type IconName =
  | "camera"
  | "leaf"
  | "scissors";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    camera: (
      <>
        <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4c-7 0-12 3-12 9 0 3 2 5 5 5 6 0 7-7 7-14Z" />
        <path d="M4 20c3-5 7-8 13-11" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="7" r="3" />
        <circle cx="6" cy="17" r="3" />
        <path d="m8.6 8.5 11 6.5M8.6 15.5 20 9M14 12l-3-2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

type AppView =
  | "home"
  | "plants"
  | "photo-identification"
  | "my-plants"
  | "account"
  | "auth";
type AuthRouteMode = AuthMode | "forgot-password" | "reset-password";

type AppRoute = {
  view: AppView;
  authMode?: AuthRouteMode;
  authNotice?: "password-reset-completed" | "session-expired";
  accountDeletionCompleted?: boolean;
  careFromMyPlants?: boolean;
  careEdit?: boolean;
  careHistory?: boolean;
  careUpdated?: boolean;
  myPlantCompletion?: "deleted" | "updated";
  myPlantEdit?: boolean;
  myPlantEditFromMyPlants?: boolean;
  plantId?: string;
  plantConfirmation?: boolean;
  plantGuidance?: boolean;
  recordId?: string;
  userPlantId?: string;
};

const homeRoute: AppRoute = { view: "home" };
const availablePlantIds = new Set(loadPlants().map((plant) => plant.id));

function readRoute(value: unknown): AppRoute {
  if (typeof value !== "object" || value === null) return homeRoute;

  const route = (value as { pruningAssistantRoute?: unknown }).pruningAssistantRoute;
  if (typeof route !== "object" || route === null) return homeRoute;

  const {
    authMode,
    authNotice,
    accountDeletionCompleted,
    careFromMyPlants,
    careEdit,
    careHistory,
    careUpdated,
    myPlantCompletion,
    myPlantEdit,
    myPlantEditFromMyPlants,
    plantConfirmation,
    plantGuidance,
    plantId,
    recordId,
    userPlantId,
    view,
  } = route as {
    authMode?: unknown;
    authNotice?: unknown;
    accountDeletionCompleted?: unknown;
    careFromMyPlants?: unknown;
    careEdit?: unknown;
    careHistory?: unknown;
    careUpdated?: unknown;
    myPlantCompletion?: unknown;
    myPlantEdit?: unknown;
    myPlantEditFromMyPlants?: unknown;
    plantConfirmation?: unknown;
    plantGuidance?: unknown;
    plantId?: unknown;
    recordId?: unknown;
    userPlantId?: unknown;
    view?: unknown;
  };
  if (
    view !== "home" &&
    view !== "plants" &&
    view !== "photo-identification" &&
    view !== "my-plants" &&
    view !== "account" &&
    view !== "auth"
  ) {
    return homeRoute;
  }

  return {
    view,
    accountDeletionCompleted:
      view === "home" && accountDeletionCompleted === true ? true : undefined,
    authMode:
      view === "auth" &&
      (authMode === "sign-up" ||
        authMode === "forgot-password" ||
        authMode === "reset-password")
        ? authMode
        : undefined,
    authNotice:
      view === "auth" &&
      (authNotice === "session-expired" ||
        authNotice === "password-reset-completed")
        ? authNotice
        : undefined,
    careFromMyPlants:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careFromMyPlants === true
        ? true
        : undefined,
    careHistory:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careEdit !== true &&
      careHistory === true
        ? true
        : undefined,
    careEdit:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit !== true &&
      careEdit === true
        ? true
        : undefined,
    careUpdated:
      view === "my-plants" && careHistory === true && careUpdated === true
        ? true
        : undefined,
    myPlantCompletion:
      view === "my-plants" &&
      (myPlantCompletion === "updated" || myPlantCompletion === "deleted")
        ? myPlantCompletion
        : undefined,
    myPlantEdit:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit === true
        ? true
        : undefined,
    myPlantEditFromMyPlants:
      view === "my-plants" &&
      typeof userPlantId === "string" &&
      myPlantEdit === true &&
      myPlantEditFromMyPlants === true
        ? true
        : undefined,
    plantId: view === "plants" && typeof plantId === "string" ? plantId : undefined,
    plantConfirmation:
      view === "plants" &&
      typeof plantId === "string" &&
      plantConfirmation === true &&
      plantGuidance !== true
        ? true
        : undefined,
    plantGuidance:
      view === "plants" && typeof plantId === "string" && plantGuidance === true
        ? true
        : undefined,
    recordId:
      view === "my-plants" && careEdit === true && typeof recordId === "string"
        ? recordId
        : undefined,
    userPlantId:
      view === "my-plants" && typeof userPlantId === "string" && userPlantId.length > 0
        ? userPlantId
        : undefined,
  };
}

function readMyPlantsRouteFromLocation(): AppRoute | undefined {
  const parameters = new URLSearchParams(window.location.search);
  const userPlantId = parameters.get("userPlantId");
  const careView = parameters.get("view");
  if (
    !userPlantId ||
    (careView !== "plant-care" &&
      careView !== "plant-care-history" &&
      careView !== "plant-care-edit" &&
      careView !== "my-plant-edit")
  ) {
    return undefined;
  }
  return {
    view: "my-plants",
    careHistory: careView === "plant-care-history" ? true : undefined,
    careEdit: careView === "plant-care-edit" ? true : undefined,
    myPlantEdit: careView === "my-plant-edit" ? true : undefined,
    recordId: careView === "plant-care-edit" ? parameters.get("recordId") ?? "" : undefined,
    userPlantId,
  };
}

function readAuthRouteFromLocation(): AppRoute | undefined {
  const view = new URLSearchParams(window.location.search).get("view");
  if (view === "forgot-password") {
    return { view: "auth", authMode: "forgot-password" };
  }
  if (view === "password-reset") {
    return { view: "auth", authMode: "reset-password" };
  }
  return undefined;
}

function getInitialRoute() {
  const authRoute = readAuthRouteFromLocation();
  if (authRoute) return authRoute;
  const storedRoute = readRoute(window.history.state);
  if (storedRoute.userPlantId) return storedRoute;
  return readMyPlantsRouteFromLocation() ?? homeRoute;
}

function getRouteUrl(route: AppRoute, clearAuthCallback = false) {
  const url = new URL(window.location.href);
  url.searchParams.delete("view");
  url.searchParams.delete("userPlantId");
  url.searchParams.delete("recordId");
  if (clearAuthCallback) {
    url.searchParams.delete("code");
    url.searchParams.delete("flow_id");
    url.searchParams.delete("error");
    url.searchParams.delete("error_code");
    url.searchParams.delete("error_description");
    url.hash = "";
  }
  if (route.view === "auth" && route.authMode === "forgot-password") {
    url.searchParams.set("view", "forgot-password");
  } else if (route.view === "auth" && route.authMode === "reset-password") {
    url.searchParams.set("view", "password-reset");
  } else if (route.view === "my-plants" && route.userPlantId) {
    url.searchParams.set(
      "view",
      route.myPlantEdit
        ? "my-plant-edit"
        : route.careEdit
        ? "plant-care-edit"
        : route.careHistory
          ? "plant-care-history"
          : "plant-care",
    );
    url.searchParams.set("userPlantId", route.userPlantId);
    if (route.careEdit && route.recordId) {
      url.searchParams.set("recordId", route.recordId);
    }
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function AppHeader({
  activeView,
  email,
  isAuthInitializing,
  isAuthSubmitting,
  isAccountDeletionInProgress,
  onNavigate,
  onSignOut,
}: {
  activeView: AppView;
  email?: string;
  isAuthInitializing: boolean;
  isAuthSubmitting: boolean;
  isAccountDeletionInProgress: boolean;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
}) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          className="brand"
          type="button"
          aria-label="剪定AIアシスタント ホームへ"
          onClick={() => onNavigate("home")}
          disabled={isAccountDeletionInProgress}
        >
          <span className="brand__mark">
            <Icon name="scissors" size={21} />
          </span>
          <span>剪定AIアシスタント</span>
        </button>
        <div className="app-header__actions">
          <nav className="view-navigation" aria-label="画面切り替え">
            <button
              className={activeView === "plants" ? "is-active" : ""}
              type="button"
              aria-current={activeView === "plants" ? "page" : undefined}
              onClick={() => onNavigate("plants")}
              disabled={isAccountDeletionInProgress}
            >
              植物を調べる
            </button>
            {email && (
              <button
                className={activeView === "my-plants" ? "is-active" : ""}
                type="button"
                aria-current={activeView === "my-plants" ? "page" : undefined}
                onClick={() => onNavigate("my-plants")}
                disabled={isAccountDeletionInProgress}
              >
                自分の植物
              </button>
            )}
          </nav>
          <div className="account-navigation" aria-live="polite">
            {isAuthInitializing ? (
              <span className="account-navigation__status">ログイン確認中</span>
            ) : email ? (
              <>
                <span className="account-navigation__status" title={email}>
                  <span>ログイン中</span>
                  <strong>{email}</strong>
                </span>
                <button
                  className={activeView === "account" ? "is-active" : ""}
                  type="button"
                  aria-current={activeView === "account" ? "page" : undefined}
                  onClick={() => onNavigate("account")}
                  disabled={isAccountDeletionInProgress}
                >
                  アカウント設定
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  disabled={isAuthSubmitting || isAccountDeletionInProgress}
                >
                  {isAuthSubmitting ? "処理中…" : "ログアウト"}
                </button>
              </>
            ) : (
              <button
                className={activeView === "auth" ? "is-active" : ""}
                type="button"
                aria-current={activeView === "auth" ? "page" : undefined}
                onClick={() => onNavigate("auth")}
              >
                ログイン・新規登録
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HomePage({
  accountDeletionCompleted,
  onAccountDeletionMessageConsumed,
  onOpenPhotoIdentification,
  onOpenPlants,
}: {
  accountDeletionCompleted?: boolean;
  onAccountDeletionMessageConsumed: () => void;
  onOpenPhotoIdentification: () => void;
  onOpenPlants: () => void;
}) {
  const [showAccountDeletionCompleted] = useState(accountDeletionCompleted === true);

  useEffect(() => {
    if (accountDeletionCompleted) onAccountDeletionMessageConsumed();
  }, [accountDeletionCompleted, onAccountDeletionMessageConsumed]);

  return (
    <main className="app-main home-page">
      {showAccountDeletionCompleted && (
        <div className="auth-message auth-message--success home-page__account-message" role="status">
          <strong>アカウントを削除しました</strong>
          <p>ご利用ありがとうございました。</p>
        </div>
      )}
      <section className="intro home-page__intro" aria-labelledby="home-title">
        <div className="intro__copy">
          <span className="eyebrow">PRUNING GUIDE</span>
          <h1 id="home-title">調べ方を選んでください</h1>
          <p>庭木に合った剪定情報を、分かる方法から探せます。</p>
        </div>
        <div className="intro__art" aria-hidden="true">
          <span className="intro__art-ring" />
          <Icon name="leaf" size={72} />
        </div>
      </section>

      <section className="home-options" aria-label="植物の調べ方">
        <button className="home-option" type="button" onClick={onOpenPlants}>
          <span className="home-option__icon"><Icon name="leaf" size={28} /></span>
          <span className="home-option__copy">
            <strong>植物名から選ぶ</strong>
            <span>植物名を検索して、剪定情報を確認します。</span>
          </span>
          <span className="home-option__arrow" aria-hidden="true">→</span>
        </button>

        <button className="home-option" type="button" onClick={onOpenPhotoIdentification}>
          <span className="home-option__icon"><Icon name="camera" size={28} /></span>
          <span className="home-option__copy">
            <strong>写真から調べる</strong>
            <span>写真を1枚選び、植物名の候補を調べる準備をします。</span>
          </span>
          <span className="home-option__arrow" aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}

function App() {
  const {
    clearLocalSession,
    isInitializing: isAuthInitializing,
    isSubmitting: isAuthSubmitting,
    passwordRecoveryStatus,
    signOut,
    user,
  } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() => getInitialRoute());
  const [plantQuery, setPlantQuery] = useState("");
  const [confirmedPlantId, setConfirmedPlantId] = useState<string>();
  const [isAccountDeletionInProgress, setIsAccountDeletionInProgress] = useState(false);
  const accountDeletionLockRef = useRef(false);
  const authStateRef = useRef({ isInitializing: isAuthInitializing, userId: user?.id });

  authStateRef.current = { isInitializing: isAuthInitializing, userId: user?.id };

  useEffect(() => {
    if (
      route.view !== "auth" ||
      route.authMode !== "reset-password" ||
      passwordRecoveryStatus === "checking"
    ) {
      return;
    }
    window.history.replaceState(
      { pruningAssistantRoute: route },
      "",
      getRouteUrl(route, true),
    );
  }, [passwordRecoveryStatus, route]);

  useEffect(() => {
    const initialRoute = getInitialRoute();
    window.history.replaceState(
      { pruningAssistantRoute: initialRoute },
      "",
      getRouteUrl(initialRoute),
    );
    setRoute(initialRoute);

    const handlePopState = (event: PopStateEvent) => {
      const authRoute = readAuthRouteFromLocation();
      const storedRoute = readRoute(event.state);
      let nextRoute =
        authRoute ??
        (storedRoute.userPlantId
          ? storedRoute
          : readMyPlantsRouteFromLocation() ?? storedRoute);
      const authState = authStateRef.current;
      if (
        !accountDeletionLockRef.current &&
        !authState.isInitializing &&
        !authState.userId &&
        (nextRoute.view === "account" || nextRoute.view === "my-plants")
      ) {
        nextRoute = homeRoute;
        window.history.replaceState(
          { pruningAssistantRoute: nextRoute },
          "",
          getRouteUrl(nextRoute),
        );
      }
      if (
        (nextRoute.plantConfirmation || nextRoute.plantGuidance) &&
        nextRoute.plantId
      ) {
        setConfirmedPlantId(nextRoute.plantId);
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0 });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    if (accountDeletionLockRef.current) return;
    if (
      route.view === nextRoute.view &&
      route.authMode === nextRoute.authMode &&
      route.authNotice === nextRoute.authNotice &&
      route.accountDeletionCompleted === nextRoute.accountDeletionCompleted &&
      route.careFromMyPlants === nextRoute.careFromMyPlants &&
      route.careEdit === nextRoute.careEdit &&
      route.careHistory === nextRoute.careHistory &&
      route.careUpdated === nextRoute.careUpdated &&
      route.myPlantCompletion === nextRoute.myPlantCompletion &&
      route.myPlantEdit === nextRoute.myPlantEdit &&
      route.myPlantEditFromMyPlants === nextRoute.myPlantEditFromMyPlants &&
      route.plantId === nextRoute.plantId &&
      route.plantConfirmation === nextRoute.plantConfirmation &&
      route.plantGuidance === nextRoute.plantGuidance &&
      route.recordId === nextRoute.recordId &&
      route.userPlantId === nextRoute.userPlantId
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.history.pushState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute),
    );
    setRoute(nextRoute);
    window.scrollTo({ top: 0 });
  };

  const consumeCareUpdated = () => {
    if (!route.careUpdated) return;

    const nextRoute = { ...route, careUpdated: undefined };
    window.history.replaceState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute),
    );
    setRoute(nextRoute);
  };

  const replaceRoute = (nextRoute: AppRoute) => {
    const clearAuthCallback =
      route.view === "auth" && route.authMode === "reset-password";
    window.history.replaceState(
      { pruningAssistantRoute: nextRoute },
      "",
      getRouteUrl(nextRoute, clearAuthCallback),
    );
    setRoute(nextRoute);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (
      isAuthInitializing ||
      user ||
      accountDeletionLockRef.current ||
      (route.view !== "account" && route.view !== "my-plants")
    ) {
      return;
    }
    replaceRoute(homeRoute);
  }, [isAuthInitializing, route.view, user]);

  const consumeAccountDeletionCompletion = () => {
    if (!route.accountDeletionCompleted) return;
    replaceRoute({ ...route, accountDeletionCompleted: undefined });
  };

  const consumePasswordResetCompletion = () => {
    if (route.authNotice !== "password-reset-completed") return;
    replaceRoute({ ...route, authNotice: undefined });
  };

  const consumeMyPlantCompletion = () => {
    if (!route.myPlantCompletion) return;
    replaceRoute({ ...route, myPlantCompletion: undefined });
  };

  const navigateToView = (view: AppView) => navigate({ view });

  const resetTransientAppState = () => {
    setPlantQuery("");
    setConfirmedPlantId(undefined);
  };

  const finishAuthentication = () => {
    resetTransientAppState();
    navigate(homeRoute);
  };

  const handleSignOut = async () => {
    if (accountDeletionLockRef.current) return;
    try {
      await signOut();
      resetTransientAppState();
      navigate(homeRoute);
    } catch {
      navigate({ view: "auth" });
    }
  };

  const handleDeleteAccount = async (
    password: string,
  ): Promise<AccountDeletionFailureCode | null> => {
    if (accountDeletionLockRef.current) return "request_in_progress";

    accountDeletionLockRef.current = true;
    setIsAccountDeletionInProgress(true);
    try {
      const result = await deleteCurrentAccount(password).finally(() => {
        password = "";
      });
      if (!result.ok) {
        if (result.code === "unauthorized") {
          await clearLocalSession();
          replaceRoute({ view: "auth", authNotice: "session-expired" });
        }
        return result.code;
      }

      await clearLocalSession();
      resetTransientAppState();
      replaceRoute({ view: "home", accountDeletionCompleted: true });
      return null;
    } catch {
      return "unexpected_response";
    } finally {
      accountDeletionLockRef.current = false;
      setIsAccountDeletionInProgress(false);
    }
  };

  const confirmPlant = (plantId: string) => {
    setConfirmedPlantId(plantId);
    navigate({ view: "plants", plantId, plantConfirmation: true });
  };

  return (
    <div className="app-shell" id="top">
      <AppHeader
        activeView={route.view}
        email={user?.email}
        isAuthInitializing={isAuthInitializing}
        isAuthSubmitting={isAuthSubmitting}
        isAccountDeletionInProgress={isAccountDeletionInProgress}
        onNavigate={navigateToView}
        onSignOut={() => void handleSignOut()}
      />

      {route.view === "home" ? (
        <HomePage
          accountDeletionCompleted={route.accountDeletionCompleted}
          onAccountDeletionMessageConsumed={consumeAccountDeletionCompletion}
          onOpenPhotoIdentification={() => navigateToView("photo-identification")}
          onOpenPlants={() => navigateToView("plants")}
        />
      ) : route.view === "auth" ? (
        route.authMode === "forgot-password" ? (
          <PasswordResetRequestPage
            onBackToLogin={() => navigate({ view: "auth" })}
          />
        ) : route.authMode === "reset-password" ? (
          <PasswordResetUpdatePage
            onBackToRequest={() =>
              replaceRoute({ view: "auth", authMode: "forgot-password" })
            }
            onUpdated={() =>
              replaceRoute({
                view: "auth",
                authNotice: "password-reset-completed",
              })
            }
          />
        ) : (
          <AuthPage
            mode={route.authMode ?? "sign-in"}
            onAuthenticated={finishAuthentication}
            onBackHome={() => navigateToView("home")}
            onForgotPassword={() =>
              navigate({ view: "auth", authMode: "forgot-password" })
            }
            onModeChange={(authMode) => navigate({ view: "auth", authMode })}
            onPasswordResetNoticeConsumed={consumePasswordResetCompletion}
            passwordResetCompletedNotice={
              route.authNotice === "password-reset-completed"
            }
            sessionExpiredNotice={route.authNotice === "session-expired"}
          />
        )
      ) : route.view === "photo-identification" ? (
        <PlantPhotoIdentificationPage
          availablePlantIds={availablePlantIds}
          isAuthInitializing={isAuthInitializing}
          onBackHome={() => navigateToView("home")}
          onLogin={() => navigate({ view: "auth" })}
          onViewPlant={(plantId) => navigate({ view: "plants", plantId })}
          userId={user?.id}
        />
      ) : route.view === "account" ? (
        <AccountSettingsPage
          email={user?.email}
          isAuthInitializing={isAuthInitializing}
          isDeleting={isAccountDeletionInProgress}
          onBackHome={() => navigateToView("home")}
          onDeleteAccount={handleDeleteAccount}
          onLogin={() => navigate({ view: "auth" })}
        />
      ) : route.view === "my-plants" ? (
        route.userPlantId ? (
          route.myPlantEdit ? (
            <MyPlantEditPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.myPlantEditFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onDeleted={() =>
                replaceRoute({ view: "my-plants", myPlantCompletion: "deleted" })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdated={() =>
                replaceRoute({ view: "my-plants", myPlantCompletion: "updated" })
              }
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : route.careEdit ? (
            <MyPlantCareRecordPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() =>
                navigate({
                  view: "my-plants",
                  userPlantId: route.userPlantId,
                  careHistory: true,
                })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdated={(userPlantId) =>
                navigate({
                  view: "my-plants",
                  userPlantId,
                  careHistory: true,
                  careUpdated: true,
                })
              }
              recordId={route.recordId ?? ""}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : route.careHistory ? (
            <MyPlantCareHistoryPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.careFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onCreateRecord={(userPlantId) =>
                navigate({ view: "my-plants", userPlantId })
              }
              onEditRecord={(userPlantId, recordId) =>
                navigate({
                  view: "my-plants",
                  userPlantId,
                  careEdit: true,
                  recordId,
                })
              }
              onLogin={() => navigate({ view: "auth" })}
              onUpdatedMessageConsumed={consumeCareUpdated}
              updatedMessage={route.careUpdated}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          ) : (
            <MyPlantCareRecordPage
              isAuthInitializing={isAuthInitializing}
              onBackToMyPlants={() => {
                if (route.careFromMyPlants) {
                  window.history.back();
                  return;
                }
                navigate({ view: "my-plants" });
              }}
              onLogin={() => navigate({ view: "auth" })}
              userId={user?.id}
              userPlantId={route.userPlantId}
            />
          )
        ) : (
          <MyPlantsPage
            completionMessage={route.myPlantCompletion}
            isAuthInitializing={isAuthInitializing}
            onBackHome={() => navigateToView("home")}
            onCompletionMessageConsumed={consumeMyPlantCompletion}
            onCreateRecord={(userPlantId) =>
              navigate({ view: "my-plants", userPlantId, careFromMyPlants: true })
            }
            onEditPlant={(userPlantId) =>
              navigate({
                view: "my-plants",
                userPlantId,
                myPlantEdit: true,
                myPlantEditFromMyPlants: true,
              })
            }
            onViewHistory={(userPlantId) =>
              navigate({
                view: "my-plants",
                userPlantId,
                careFromMyPlants: true,
                careHistory: true,
              })
            }
            onLogin={() => navigate({ view: "auth" })}
            onViewDetails={(plantId) => navigate({ view: "plants", plantId })}
            onViewGuidance={(plantId) => {
              setConfirmedPlantId(plantId);
              navigate({ view: "plants", plantId, plantGuidance: true });
            }}
            userId={user?.id}
          />
        )
      ) : (
        <PlantListPage
          confirmedPlantId={confirmedPlantId}
          isAuthInitializing={isAuthInitializing}
          isConfirmation={route.plantConfirmation === true}
          isGuidance={route.plantGuidance === true}
          onBackHome={() => navigateToView("home")}
          onBackToConfirmation={() => window.history.back()}
          onBackToList={() => window.history.back()}
          onChooseAgain={() => navigate({ view: "plants" })}
          onConfirmPlant={confirmPlant}
          onLogin={() => navigate({ view: "auth" })}
          onQueryChange={setPlantQuery}
          onSelectPlant={(plantId) => navigate({ view: "plants", plantId })}
          onViewGuidance={() => {
            if (!confirmedPlantId) return;
            navigate({ view: "plants", plantId: confirmedPlantId, plantGuidance: true });
          }}
          query={plantQuery}
          selectedPlantId={
            route.plantConfirmation || route.plantGuidance ? undefined : route.plantId
          }
          userId={user?.id}
        />
      )}

      <footer className="app-footer">
        <div>
          <span className="brand brand--footer">
            <span className="brand__mark"><Icon name="scissors" size={19} /></span>
            <span>AI Pruning Assistant</span>
          </span>
          <p>庭木と人の安全を第一に、無理のない範囲で作業してください。</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
