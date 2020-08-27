package org.cedar.onestop.gateway.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.RedirectServerAuthenticationFailureHandler;
import org.springframework.security.web.server.authentication.RedirectServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.authentication.logout.RedirectServerLogoutSuccessHandler;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.net.URI;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableEntryException;

import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

@EnableWebFluxSecurity
public class SecurityConfig {

  @Autowired
  ReactiveClientRegistrationRepository clientRegistrations;

  @Autowired
  ServerOAuth2AuthorizedClientRepository authorizedClients;

  public static final String API_MATCHER_PATH = "/api/user/**";

  private LoginGovConfiguration loginGovConfiguration;
//  public KeystoreUtil keystoreUtil;

  @Autowired
  SecurityConfig(LoginGovConfiguration loginGovConfiguration) {
    this.loginGovConfiguration = loginGovConfiguration;
//    LoginGovConfiguration.Keystore keystore = loginGovConfiguration.keystore;
//    this.keystoreUtil = new KeystoreUtil(
//            keystore.file,
//            keystore.password,
//            keystore.alias,
//            null,
//            keystore.type
//    );

  }

  @Bean
  WebClientReactivePrivateKeyJwtTokenResponseClient tokenResponseClient(WebClient webClient) throws UnrecoverableEntryException, NoSuchAlgorithmException, KeyStoreException, IOException {
    return new WebClientReactivePrivateKeyJwtTokenResponseClient(webClient, this.loginGovConfiguration);
  }

//  @Bean
  public ServerLogoutSuccessHandler logoutSuccessHandler(String uri) {
    RedirectServerLogoutSuccessHandler successHandler = new RedirectServerLogoutSuccessHandler();
    successHandler.setLogoutSuccessUrl(URI.create(uri));
    return successHandler;
  }
//  public ServerLogoutFailureHandler logoutSuccessHandler(String uri) {
//    RedirectServerLogoutSuccessHandler successHandler = new RedirectServerLogoutSuccessHandler();
//    successHandler.setLogoutSuccessUrl(URI.create(uri));
//    return successHandler;
//  }


  @Bean
  public SecurityWebFilterChain securityWebFilterChain(final ServerHttpSecurity http) {
    // the matcher for all paths that need to be secured (require a logged-in user)
    final ServerWebExchangeMatcher apiPathMatcher = pathMatchers(API_MATCHER_PATH);

    return http
        .authorizeExchange().matchers(apiPathMatcher).authenticated()
        .anyExchange().permitAll()
        .and().httpBasic().disable()
        .csrf().disable()
        .oauth2Client()
        .and()
        .oauth2Login()
            .authenticationSuccessHandler(new RedirectServerAuthenticationSuccessHandler("/onestop"))
//          .authenticationSuccessHandler(new LoginGovAuthenticationSuccessHandler())
//          .authenticationFailureHandler(new LoginGovAuthenticationFailureHandler())
            .authenticationFailureHandler(new RedirectServerAuthenticationFailureHandler("/onestop"))
        .and()
        .logout()
            .logoutUrl("/logout")
            .logoutSuccessHandler(logoutSuccessHandler("/onestop"))
        .and()
        .build();
  }
}
